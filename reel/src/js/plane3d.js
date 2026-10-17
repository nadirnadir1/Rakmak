/* Live three.js airliner for the opening fly-through.
   Glossy fuselage with a procedural livery (windows, seals, cheatline, panel seams) computed per pixel,
   so it stays razor sharp however close the camera gets. The hero window (k = 0) is punched out of the
   canvas with an anti-aliased edge: the DOM cabin layer behind the canvas shows through it.

   window.buildPlane(THREE, canvas, opts) -> Promise<api>
     api.render({ pos:[x,y,z], look:[x,y,z], roll, fov })   draw one frame
     api.project([x,y,z]) -> [px, py, depth]                  stage pixels of a world point (after the last render)
     api.W0, api.N                                            hero window centre and outward normal (world) */
(function () {
  window.buildPlane = async function (THREE, canvas, o = {}) {
    const W = o.w || 1080, H = o.h || 1920;
    const R0 = 2.0, PITCH = 0.533, SW = 0.25;               // radius, window pitch, window centre (arc, metres above side meridian)
    const WIN = [0.118, 0.168], WR = 0.108;                 // window half size (along, around) and corner radius

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = o.exposure || 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(o.fov || 70, W / H, 0.004, 4000);
    const sunDir = new THREE.Vector3(...(o.sun || [-0.55, 0.42, 0.72])).normalize();

    // ---------------- sky dome ----------------
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { sunDir: { value: sunDir } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `
        varying vec3 vDir; uniform vec3 sunDir;
        void main(){
          vec3 d = normalize(vDir);
          vec3 zen = vec3(0.004, 0.032, 0.30), hor = vec3(0.36, 0.55, 0.86), low = vec3(0.78, 0.83, 0.92);
          vec3 c = d.y > 0.0 ? mix(hor, zen, pow(clamp(d.y, 0.0, 1.0), 0.5)) : mix(hor, low, pow(clamp(-d.y, 0.0, 1.0), 0.35));
          float sd = max(dot(d, sunDir), 0.0);
          c += vec3(1.0, 0.82, 0.58) * (pow(sd, 600.0) * 30.0 + pow(sd, 18.0) * 0.5 + pow(sd, 3.0) * 0.12);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), skyMat);
    sky.renderOrder = -10;
    // reflection environment from the sky alone
    const envMat = skyMat.clone();
    envMat.fragmentShader = skyMat.fragmentShader.replace('low = vec3(0.78, 0.83, 0.92)', 'low = vec3(0.30, 0.36, 0.48)');
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), envMat));
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.015).texture;
    scene.add(sky);

    // ---------------- clouds (sprites of the reel's lit cumulus) ----------------
    const loader = new THREE.TextureLoader();
    const texs = await Promise.all([1, 2, 3, 4, 5, 6].map((i) => loader.loadAsync(`${o.asset || '../assets/img/'}fx/cloud${i}.png`)));
    texs.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; });
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const t = texs[(rnd() * 6) | 0];
      const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.95, color: 0xffffff });
      const s = new THREE.Sprite(m);
      const ang = -0.2 - rnd() * 3.2, dist = 120 + rnd() * 900;      // spread around, mostly behind the fuselage
      const sc = (60 + rnd() * 160) * (dist / 500 + 0.4);
      s.scale.set(sc, sc * t.image.height / t.image.width, 1);
      s.position.set(Math.cos(ang) * dist * 1.4, -40 - rnd() * 140 - dist * 0.08, Math.sin(ang) * dist - 60);
      s.renderOrder = -5;
      scene.add(s);
    }

    // ---------------- fuselage ----------------
    const U = {
      uR: { value: R0 }, uPitch: { value: PITCH }, uSw: { value: SW },
      uWin: { value: new THREE.Vector2(WIN[0], WIN[1]) }, uWinR: { value: WR },
    };
    const GLSL_COMMON = `
      uniform float uR, uPitch, uSw, uWinR; uniform vec2 uWin;
      varying vec3 vObj;
      float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
      // fuselage surface coordinates: fu = along the axis (world x), fs = arc length up from the side meridian
      void fcoords(out float fu, out float fs){ fu = -vObj.y; fs = uR * atan(vObj.x, vObj.z); }
    `;
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.07 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GLSL_COMMON + '\nfloat gGlass = 0.0;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            float fu, fs; fcoords(fu, fs);
            float k = floor(fu / uPitch + 0.5);
            vec2 wp = vec2(fu - k * uPitch, fs - uSw);
            float d = sdRR(wp, uWin, uWinR);
            float aw = max(fwidth(d), 1e-5);
            if (abs(k) < 0.5 && d < -2.0 * aw) discard;             // hero window: the punch pass cuts the soft edge
            vec3 paint = vec3(0.90, 0.905, 0.915);
            float as = max(fwidth(fs), 1e-5), au = max(fwidth(fu), 1e-5);
            // cheatline: brand blue band + thin orange pinstripe under the windows
            float b0 = uSw - 0.40, b1 = uSw - 0.31;
            float blue = smoothstep(b0 - as, b0 + as, fs) * (1.0 - smoothstep(b1 - as, b1 + as, fs));
            float o0 = uSw - 0.445, o1 = uSw - 0.425;
            float orng = smoothstep(o0 - as, o0 + as, fs) * (1.0 - smoothstep(o1 - as, o1 + as, fs));
            vec3 col = mix(paint, vec3(0.0, 0.018, 0.20), blue);
            col = mix(col, vec3(0.90, 0.20, 0.0), orng);
            // panel seams: every second window gap + two longitudinal seams
            float m = mod(fu - 0.5 * uPitch, 2.0 * uPitch); float dsu = min(m, 2.0 * uPitch - m);
            float seamU = 1.0 - smoothstep(0.0012, 0.0012 + au, dsu);
            float dss = min(abs(fs - (uSw + 0.47)), abs(fs - (uSw - 0.56)));
            float seamS = 1.0 - smoothstep(0.0012, 0.0012 + as, dss);
            // rivet rows beside the seams
            float rv = 0.0;
            { float ru = abs(dsu - 0.012); float rs = mod(fs, 0.032) - 0.016; rv = max(rv, 1.0 - smoothstep(0.0022, 0.0022 + au, length(vec2(ru, rs)))); }
            col *= 1.0 - 0.28 * max(seamU, seamS) - 0.10 * rv * (1.0 - blue);
            // window: glass, rubber seal, painted frame ring
            float glass = 1.0 - smoothstep(-aw, aw, d);
            float seal = (1.0 - smoothstep(0.007 - aw, 0.007 + aw, d)) * (1.0 - glass);
            float frame = (1.0 - smoothstep(0.030 - aw, 0.030 + aw, d)) * (1.0 - glass) * (1.0 - seal);
            col = mix(col, col * vec3(0.86, 0.88, 0.92), frame);
            col = mix(col, vec3(0.025, 0.028, 0.034), seal);
            col = mix(col, vec3(0.006, 0.010, 0.020), glass);
            gGlass = glass;
            diffuseColor.rgb = col;
          }`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.04, gGlass);');
    };
    const geo = new THREE.CylinderGeometry(R0, R0, 160, 720, 1, true);
    const fus = new THREE.Mesh(geo, mat);
    fus.rotation.z = Math.PI / 2;
    scene.add(fus);

    // punch: multiplies the canvas by (1 - coverage) inside the hero window -> transparent hole, AA edge
    const punchMat = new THREE.ShaderMaterial({
      uniforms: U, transparent: true, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: 'varying vec3 vObj; void main(){ vObj = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: GLSL_COMMON + `
        void main(){
          float fu, fs; fcoords(fu, fs);
          float d = sdRR(vec2(fu, fs - uSw), uWin, uWinR);
          float aw = max(fwidth(d), 1e-5);
          float a = 1.0 - smoothstep(-aw, aw, d);
          if (a <= 0.0) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, a);
        }`,
    });
    const punch = new THREE.Mesh(geo, punchMat);
    punch.rotation.z = Math.PI / 2;
    punch.renderOrder = 20;
    scene.add(punch);

    // ---------------- lights ----------------
    const sun = new THREE.DirectionalLight(o.sunC || 0xffe2b8, o.sunI || 2.6);
    sun.position.copy(sunDir).multiplyScalar(50);
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0xbcd6ff, 0x5a6478, o.hemiI || 0.55));
    scene.environmentIntensity = o.envI || 0.8;

    // hero window centre + outward normal (world)
    const th = SW / R0;
    const W0 = new THREE.Vector3(0, R0 * Math.sin(th), R0 * Math.cos(th));
    const N = new THREE.Vector3(0, Math.sin(th), Math.cos(th));

    const v = new THREE.Vector3();
    const api = {
      renderer, scene, camera, W0, N, R0, PITCH, SW, WIN, WR,
      render(c) {
        if (c.fov) { camera.fov = c.fov; camera.updateProjectionMatrix(); }
        camera.position.set(...c.pos);
        const roll = c.roll || 0;
        camera.up.set(Math.sin(roll), Math.cos(roll), 0);
        camera.lookAt(...c.look);
        camera.updateMatrixWorld();
        renderer.render(scene, camera);
      },
      project(p) {
        v.set(...p).project(camera);
        return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z];
      },
      // stage-pixel outline of the hero window (n points), for aligning DOM layers
      windowPoint(u, s) {
        const a = (SW + s) / R0;
        return [u, R0 * Math.sin(a), R0 * Math.cos(a)];
      },
    };
    return api;
  };
})();
