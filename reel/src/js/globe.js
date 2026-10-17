/* Dotted 3D globe on canvas: orthographic projection, limb shading, atmosphere,
   great-circle flight arcs (with occlusion) and a plane following an arc. */
(function () {
  const R = window.R;
  const D2R = Math.PI / 180;
  const dots = window.GLOBE_DOTS;
  const N = dots.length / 2;
  const P3 = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const lo = dots[2 * i] * D2R, la = dots[2 * i + 1] * D2R;
    P3[3 * i] = Math.cos(la) * Math.sin(lo);
    P3[3 * i + 1] = Math.sin(la);
    P3[3 * i + 2] = Math.cos(la) * Math.cos(lo);
  }
  R.CITIES = {
    RAK: [31.63, -8.0, 'MARRAKECH'], CDG: [48.86, 2.35, 'PARIS'], LHR: [51.51, -0.13, 'LONDON'],
    MAD: [40.42, -3.7, 'MADRID'], FCO: [41.9, 12.5, 'ROME'], IST: [41.01, 28.98, 'ISTANBUL'],
    DXB: [25.2, 55.27, 'DUBAI'], DOH: [25.29, 51.53, 'DOHA'], JED: [21.54, 39.17, 'JEDDAH'],
    CAI: [30.04, 31.24, 'CAIRO'], JFK: [40.71, -74.01, 'NEW YORK'], AMS: [52.37, 4.9, 'AMSTERDAM'],
    DSS: [14.72, -17.47, 'DAKAR'], YUL: [45.5, -73.57, 'MONTRÉAL'],
  };
  const vec = (lat, lon) => [Math.cos(lat * D2R) * Math.sin(lon * D2R), Math.sin(lat * D2R), Math.cos(lat * D2R) * Math.cos(lon * D2R)];
  const PLANE = new Path2D('M50 4 C54 4 56 10 56 18 L56 38 L94 58 L94 66 L56 56 L56 80 L68 89 L68 95 L50 90 L32 95 L32 89 L44 80 L44 56 L6 66 L6 58 L44 38 L44 18 C44 10 46 4 50 4 Z');

  R.Globe = function (canvas, st) {
    const ctx = canvas.getContext('2d');
    // rotation: view centre (lon0, lat0) -> rotate world by -lon0 about Y, then by lat0 about X
    function rot(v, lon0, lat0) {
      const cl = Math.cos(-lon0 * D2R), sl = Math.sin(-lon0 * D2R);
      const x1 = v[0] * cl + v[2] * sl, z1 = -v[0] * sl + v[2] * cl, y1 = v[1];
      const cp = Math.cos(lat0 * D2R), sp = Math.sin(lat0 * D2R);
      return [x1, y1 * cp - z1 * sp, y1 * sp + z1 * cp];
    }
    function project(lat, lon, alt = 1) {
      const v = vec(lat, lon);
      const r = rot([v[0] * alt, v[1] * alt, v[2] * alt], st.lon, st.lat);
      return { x: st.cx + r[0] * st.r, y: st.cy - r[1] * st.r, z: r[2], vis: r[2] > 0 || Math.hypot(r[0], r[1]) > 1.0 };
    }
    // great circle point at fraction f with altitude bump
    function gc(a, b, f, bump) {
      const va = vec(a[0], a[1]), vb = vec(b[0], b[1]);
      const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
      const om = Math.acos(dot), so = Math.sin(om) || 1e-6;
      const k1 = Math.sin((1 - f) * om) / so, k2 = Math.sin(f * om) / so;
      const alt = 1 + bump * Math.sin(Math.PI * f) * Math.min(1, om / 0.9);
      return [(va[0] * k1 + vb[0] * k2) * alt, (va[1] * k1 + vb[1] * k2) * alt, (va[2] * k1 + vb[2] * k2) * alt];
    }
    function p3(v) {
      const r = rot(v, st.lon, st.lat);
      return { x: st.cx + r[0] * st.r, y: st.cy - r[1] * st.r, z: r[2], vis: r[2] > 0 || Math.hypot(r[0], r[1]) > 1.0 };
    }

    function draw(t) {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      if (st.alpha <= 0.001) return;
      ctx.save();
      ctx.globalAlpha = st.alpha;
      const { cx, cy, r } = st;
      // atmosphere glow
      let g = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.32);
      g.addColorStop(0, 'rgba(70,150,255,0.55)'); g.addColorStop(0.35, 'rgba(40,110,255,0.18)'); g.addColorStop(1, 'rgba(20,80,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.32, 0, 6.2832); ctx.fill();
      // ocean sphere
      g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
      g.addColorStop(0, '#173f8f'); g.addColorStop(0.6, '#0b2560'); g.addColorStop(1, '#040f2e');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
      // land dots (bucketed by depth for fewer fillStyle changes)
      const cl = Math.cos(-st.lon * D2R), sl = Math.sin(-st.lon * D2R);
      const cp = Math.cos(st.lat * D2R), sp = Math.sin(st.lat * D2R);
      const NB = 8, buckets = Array.from({ length: NB }, () => []);
      for (let i = 0; i < N; i++) {
        const x = P3[3 * i], y = P3[3 * i + 1], z = P3[3 * i + 2];
        const x1 = x * cl + z * sl, z1 = -x * sl + z * cl;
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        if (z2 <= 0.02) continue;
        buckets[Math.min(NB - 1, Math.floor(z2 * NB))].push(cx + x1 * r, cy - y2 * r);
      }
      const ds = st.dot * (r / 440);
      for (let b = 0; b < NB; b++) {
        const zf = (b + 0.5) / NB;
        const a = 0.25 + 0.75 * Math.pow(zf, 0.7);
        ctx.fillStyle = `rgba(${Math.round(150 + 90 * zf)},${Math.round(200 + 45 * zf)},255,${a})`;
        const s = ds * (0.55 + 0.45 * zf), h = s / 2;
        const arr = buckets[b];
        for (let k = 0; k < arr.length; k += 2) ctx.fillRect(arr[k] - h, arr[k + 1] - h, s, s);
      }
      // rim light + specular
      g = ctx.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
      g.addColorStop(0, 'rgba(120,190,255,0)'); g.addColorStop(1, 'rgba(120,190,255,0.35)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
      g = ctx.createRadialGradient(cx - r * 0.45, cy - r * 0.5, 0, cx - r * 0.45, cy - r * 0.5, r * 0.9);
      g.addColorStop(0, 'rgba(255,255,255,0.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();

      // arcs
      for (const a of st.arcs) {
        if (a.p <= 0) continue;
        const A = R.CITIES[a.from], B = R.CITIES[a.to];
        const tail = Math.max(0, a.p - (a.len || 1)), head = Math.min(1, a.p);
        const steps = 60;
        ctx.lineCap = 'round';
        let prev = null;
        for (let i = 0; i <= steps; i++) {
          const f = tail + (head - tail) * (i / steps);
          const q = p3(gc(A, B, f, a.bump || 0.22));
          if (prev && q.vis && prev.vis) {
            const k = i / steps;
            ctx.strokeStyle = `rgba(255,${Math.round(150 + 60 * k)},${Math.round(40 + 40 * k)},${(0.25 + 0.75 * k) * (a.alpha ?? 1)})`;
            ctx.lineWidth = (a.w || 5) * (r / 440) * (0.5 + 0.5 * k);
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
          prev = q;
        }
        // destination dot when arrived
        if (a.p >= 1) {
          const q = project(B[0], B[1]);
          if (q.vis) { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(q.x, q.y, 7 * (r / 440), 0, 6.2832); ctx.fill(); }
        }
        // plane on the head
        if (a.plane && head > 0 && head < 1) {
          const q = p3(gc(A, B, head, a.bump || 0.22));
          const q2 = p3(gc(A, B, Math.min(1, head + 0.01), a.bump || 0.22));
          if (q.vis) {
            const ang = Math.atan2(q2.y - q.y, q2.x - q.x) + Math.PI / 2;
            ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(ang);
            const s = (a.planeSize || 0.62) * (r / 440);
            ctx.scale(s, s); ctx.translate(-50, -50);
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffffff'; ctx.fill(PLANE);
            ctx.restore();
          }
        }
      }
      // pins
      for (const p of st.pins) {
        if (p.a <= 0) continue;
        const c = R.CITIES[p.code];
        const q = project(c[0], c[1]);
        if (!q.vis) continue;
        const pr = 11 * (r / 440);
        for (let k = 0; k < 2; k++) {
          const ph = ((t * 0.9 + k * 0.5) % 1);
          ctx.strokeStyle = `rgba(255,157,46,${(1 - ph) * 0.8 * p.a})`; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(q.x, q.y, pr + ph * 46 * (r / 440), 0, 6.2832); ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.beginPath(); ctx.arc(q.x, q.y, pr + 4, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `rgba(244,129,0,${p.a})`; ctx.beginPath(); ctx.arc(q.x, q.y, pr, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
    return { draw, project };
  };
})();
