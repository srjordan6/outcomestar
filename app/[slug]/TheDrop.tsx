"use client";

/**
 * app/[slug]/TheDrop.tsx — v1 (2026-08-24).
 *
 * The signature hero. Every improved event is a tower standing at the first
 * recorded value; on entry each one falls (or rises, for higher-is-better
 * records) to where the student is now, its label counting through the
 * values as it moves, while the headline counts up the total gained. The
 * camera sweeps the row and descends with the towers.
 *
 * Ported from previews/the-drop/jrj-the-drop-3d_v2.html. Differences from
 * the preview, all deliberate:
 *   - data comes in as props (lib/progression.ts), nothing hardcoded
 *   - sized to its container, not the viewport, so it lives inside a page
 *   - colours come from the theme: caps = accent, towers = accent2
 *   - copy comes in as strings, so a second-language page can translate it
 *   - reduced motion renders the landed state once and stops
 *
 * The stage is always dark ground. It is a cinematic inset, like a video,
 * and reads that way on light and dark themes alike.
 */

import { useEffect, useRef } from "react";
import { fmtTime, type Direction, type DropEvent } from "@/lib/progression";

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any).THREE) return Promise.resolve((window as any).THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-three]");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).THREE));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = THREE_SRC; s.async = true; s.dataset.three = "1";
    s.onload = () => resolve((window as any).THREE);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export interface TheDropProps {
  events: DropEvent[];
  direction: Direction;
  totalGain: number;
  /** what the big number counts: "SECONDS FASTER", "POINTS HIGHER" */
  unit: string;
  /** small line above the number */
  eyebrow: React.ReactNode;
  /** the sentence under the number */
  sub: React.ReactNode;
  /** label under the events-landed counter */
  hudLabel: string;
  accent: string;
  accent2: string;
  ground: string;
  displayFont: string;
  /** container corner radius, from the archetype */
  radius?: number;
}

const hex = (c: string) => parseInt(c.replace("#", "").slice(0, 6), 16) || 0x888888;

export default function TheDrop(p: TheDropProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const labs = useRef<HTMLDivElement | null>(null);
  const cnt = useRef<HTMLSpanElement | null>(null);
  const now = useRef<HTMLDivElement | null>(null);
  const evn = useRef<HTMLSpanElement | null>(null);
  const evt = useRef<HTMLElement | null>(null);

  const fmt = p.direction === "lower" ? fmtTime : (x: number) => Math.round(x).toLocaleString();

  useEffect(() => {
    const el = host.current, st = stage.current, lb = labs.current;
    if (!el || !st || !lb || p.events.length === 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stop = false;
    let cleanup: (() => void) | null = null;

    loadThree().then((THREE) => {
      if (stop || !THREE) return;
      const D = p.events, n = D.length, lower = p.direction === "lower";
      const W = () => el.clientWidth || 1, H = () => el.clientHeight || 1;

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch { return; }

      const sc = new THREE.Scene();
      sc.fog = new THREE.FogExp2(hex(p.ground), 0.024);
      const cam = new THREE.PerspectiveCamera(42, W() / H(), 0.1, 300);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W(), H());
      st.appendChild(renderer.domElement);

      const cA = new THREE.Color(p.accent), cB = new THREE.Color(p.accent2);
      const cBdark = cB.clone().multiplyScalar(0.32);
      sc.add(new THREE.AmbientLight(cB.clone().lerp(new THREE.Color(0xffffff), 0.2).getHex(), 1.0));
      const key = new THREE.DirectionalLight(0xcfe2ff, 1.35); key.position.set(-9, 16, 9); sc.add(key);
      const rim = new THREE.DirectionalLight(cB.getHex(), 2.3); rim.position.set(10, 3, -12); sc.add(rim);
      const warm = new THREE.PointLight(cA.getHex(), 1.1, 42); warm.position.set(0, 6, 10); sc.add(warm);

      /* floor: dark, faintly reflective */
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(p.ground).lerp(new THREE.Color(0x000000), 0.35).getHex(), metalness: 0.55, roughness: 0.4 }),
      );
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; sc.add(floor);

      /* scale from the record, not from constants */
      const maxV = Math.max(...D.map((d) => Math.max(d.first, d.best)));
      const SC = 23.5 / (maxV || 1);

      /* lane lines running to the horizon; positioned by layout() */
      const laneMat = new THREE.MeshBasicMaterial({ color: cBdark.getHex(), transparent: true, opacity: 0.22 });
      const laneGeo = new THREE.BoxGeometry(0.035, 0.01, 240);
      const lanes: any[] = [];
      for (let L = -1; L <= n; L++) {
        const g = new THREE.Mesh(laneGeo, laneMat); sc.add(g); lanes.push(g);
      }

      const matBar = new THREE.MeshStandardMaterial({
        color: cB.getHex(), metalness: 0.42, roughness: 0.3, emissive: cBdark.getHex(), emissiveIntensity: 0.7,
      });
      const matCap = new THREE.MeshStandardMaterial({
        color: cA.getHex(), metalness: 0.68, roughness: 0.22, emissive: cA.getHex(), emissiveIntensity: 0.42,
      });
      const geoBar = new THREE.BoxGeometry(1, 1, 1), geoCap = new THREE.BoxGeometry(1.08, 0.14, 1.08);

      type Bar = { m: any; cap: any; d: DropEvent; h0: number; h1: number; x: number };
      const bars: Bar[] = [];
      D.forEach((d) => {
        const h0 = d.first * SC, h1 = d.best * SC;
        const m = new THREE.Mesh(geoBar, matBar.clone());
        m.position.set(0, h0 / 2, 0); m.scale.y = h0; sc.add(m);
        const c = new THREE.Mesh(geoCap, matCap.clone());
        c.position.set(0, h0, 0); sc.add(c);
        bars.push({ m, cap: c, d, h0, h1, x: 0 });
      });

      /* Spacing, row width, camera distance and label density all follow
         the container's aspect, so the whole record is in frame on a phone
         and on a wide screen. Recomputed on resize. */
      let sp = 2.6, rowHalf = 0, zEnd = 22, zStart = 30, labelEvery = 1;
      const TAN = Math.tan((42 / 2) * Math.PI / 180);
      const layout = () => {
        const a = W() / H();
        const fitHalf = 40 * TAN * a - 3;                    // half width that fits at the far camera
        sp = Math.min(2.6, Math.max(0.6, (2 * fitHalf) / Math.max(n - 1, 1)));
        rowHalf = ((n - 1) * sp) / 2;
        zEnd = Math.max(22, (rowHalf * 0.9 + 3) / (TAN * a));
        zStart = zEnd * 1.36;
        labelEvery = Math.max(1, Math.ceil(1.5 / sp));
        const bw = Math.min(1.5, sp * 0.58);
        bars.forEach((b, i) => {
          b.x = i * sp - rowHalf;
          b.m.position.x = b.x; b.m.scale.x = bw; b.m.scale.z = bw;
          b.cap.position.x = b.x; b.cap.scale.x = bw; b.cap.scale.z = bw;
        });
        lanes.forEach((g, i) => { g.position.set((i - 1) * sp - rowHalf, 0, 0); });
      };
      layout();

      /* bubbles */
      const bn = 220, bp = new Float32Array(bn * 3);
      for (let i = 0; i < bn; i++) {
        bp[i * 3] = (Math.random() - 0.5) * (rowHalf * 2 + 20);
        bp[i * 3 + 1] = Math.random() * 26;
        bp[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
      const bub = new THREE.Points(bg, new THREE.PointsMaterial({
        color: cB.clone().lerp(new THREE.Color(0xffffff), 0.5).getHex(), size: 0.075, transparent: true, opacity: 0.42, depthWrite: false,
      }));
      sc.add(bub);

      /* one DOM label per tower: crisp text, and the value itself counts as
         the tower moves */
      lb.innerHTML = "";
      const labEls = D.map((d) => {
        const e = document.createElement("div");
        e.className = "os-drop-lab";
        e.innerHTML = `<span class="ev"></span><span class="tm"></span><span class="dl"></span>`;
        (e.querySelector(".ev") as HTMLElement).textContent = d.label;
        (e.querySelector(".tm") as HTMLElement).textContent = d.firstText;
        (e.querySelector(".dl") as HTMLElement).textContent = `\u2212${d.pct}%`;
        lb.appendChild(e);
        return { el: e, tm: e.querySelector(".tm") as HTMLElement, landed: false };
      });
      const pv = new THREE.Vector3(), tmp = new THREE.Vector3();

      let t0: number | null = null, mx = 0, tmx = 0, shown = -1;
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        tmx = (e.clientX - r.left) / Math.max(r.width, 1) - 0.5;
      };
      const onResize = () => { cam.aspect = W() / H(); cam.updateProjectionMatrix(); renderer.setSize(W(), H()); layout(); };
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("resize", onResize);

      const START = 0.9, STEP = 0.115, FALL = 0.62;
      const total = START + n * STEP + FALL;

      const frame = (T: number) => {
        mx += (tmx - mx) * 0.05;
        let dropped = 0, gained = 0;
        bars.forEach((b, i) => {
          const pr = Math.max(0, Math.min((T - (START + i * STEP)) / FALL, 1));
          const e = pr < 1 ? 1 - Math.pow(1 - pr, 4) : 1;   /* quartic: slow lift, hard landing */
          const h = b.h0 + (b.h1 - b.h0) * e;
          b.m.scale.y = Math.max(h, 0.001); b.m.position.y = h / 2; b.cap.position.y = h;
          const land = pr >= 1;
          b.cap.material.emissiveIntensity = land ? 0.42 : 0.42 + Math.max(0, 1 - Math.abs(pr - 1) * 9) * 1.9;
          b.m.material.emissiveIntensity = land ? 0.7 : 0.7 + (pr > 0 && pr < 1 ? 0.5 : 0);
          const g = lower ? b.d.first - b.d.best : b.d.best - b.d.first;
          if (land) { dropped++; gained += g; } else if (pr > 0) gained += g * e;

          const L = labEls[i];
          pv.set(b.x, h + 0.55, 0).project(cam);
          if (pv.z < 1 && i % labelEvery === 0) {
            const sx = (pv.x * 0.5 + 0.5) * W(), sy = (-pv.y * 0.5 + 0.5) * H();
            const dist = cam.position.distanceTo(tmp.set(b.x, h, 0));
            const fs = Math.max(11, Math.min(26, 340 / dist));
            L.el.style.transform = `translate(-50%,-100%) translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0)`;
            L.el.style.opacity = Math.max(0, Math.min(1, (46 - dist) / 22)).toFixed(2);
            L.tm.style.fontSize = fs.toFixed(1) + "px";
            const cur = b.d.first + (b.d.best - b.d.first) * e;
            L.tm.textContent = land ? b.d.bestText : fmt(cur);
            if (land && !L.landed) { L.landed = true; L.el.classList.add("land"); }
          } else L.el.style.opacity = "0";

          if (pr > 0 && pr < 1 && i > shown) {
            shown = i;
            if (evn.current) evn.current.textContent = b.d.label;
            if (evt.current) evt.current.textContent = `${b.d.firstText}  \u2192  ${b.d.bestText}   \u2212${b.d.pct}%`;
          }
        });
        if (cnt.current) cnt.current.textContent = String(Math.round(gained));
        if (now.current) now.current.textContent = String(dropped);

        const s = Math.min(T / total, 1), es = 1 - Math.pow(1 - s, 3);
        cam.position.set(Math.sin(T * 0.075) * (rowHalf * 0.16) + mx * 4, 16 - es * 11.2, zStart - es * (zStart - zEnd));
        cam.lookAt(0, 5.5 - es * 4.2, 0);
        bub.position.y = (T * 0.5) % 9 - 4.5;
        renderer.render(sc, cam);
      };

      let raf = 0;
      if (reduce) {
        frame(total + 1);
      } else {
        const tick = (ts: number) => {
          if (stop) return;
          if (t0 === null) t0 = ts;
          frame((ts - t0) / 1000);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        geoBar.dispose(); geoCap.dispose(); laneGeo.dispose(); bg.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        lb.innerHTML = "";
      };
    }).catch(() => { /* CDN unreachable: the headline and copy still stand */ });

    return () => { stop = true; if (cleanup) cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.events, p.direction, p.accent, p.accent2, p.ground]);

  const ice = "#EAF2FF", mute = "#93A3BF";
  return (
    <div
      ref={host}
      data-os-drop={p.events.length}
      style={{
        position: "relative",
        height: "clamp(520px, 84vh, 760px)",
        overflow: "hidden",
        background: p.ground,
        color: ice,
        borderRadius: p.radius ?? 0,
        isolation: "isolate",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .os-drop-lab { position: absolute; left: 0; top: 0; transform: translate(-50%,-100%); text-align: center; white-space: nowrap;
          will-change: transform, opacity; transition: opacity .25s linear; opacity: 0; }
        .os-drop-lab .ev { font-family: ui-monospace, 'IBM Plex Mono', SFMono-Regular, monospace; font-size: 9.5px; letter-spacing: .14em;
          text-transform: uppercase; color: #8FA9CE; display: block; margin-bottom: 3px; }
        .os-drop-lab .tm { font-family: '${p.displayFont}', sans-serif; font-weight: 800; letter-spacing: -.02em; color: #DCE8FA;
          font-variant-numeric: tabular-nums; display: block; line-height: 1; text-shadow: 0 2px 14px rgba(4,7,14,.9); }
        .os-drop-lab.land .tm { color: ${p.accent}; text-shadow: 0 0 18px ${p.accent}80; }
        .os-drop-lab .dl { font-family: ui-monospace, 'IBM Plex Mono', monospace; font-size: 9px; color: ${p.accent}; display: block;
          margin-top: 3px; opacity: 0; transition: opacity .3s cubic-bezier(.16,1,.3,1); }
        .os-drop-lab.land .dl { opacity: .95; }
        @keyframes os-drop-f { to { opacity: 1; } }
        .os-drop-in { opacity: 0; animation: os-drop-f .9s cubic-bezier(.16,1,.3,1) forwards; }
        @media (max-width: 760px) { .os-drop-lab .ev { font-size: 8px; letter-spacing: .08em; } }
        @media (prefers-reduced-motion: reduce) { .os-drop-in { animation: none; opacity: 1; } }
      ` }} />
      <div ref={stage} aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0 }} />
      <div ref={labs} aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }} />
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: `radial-gradient(120% 80% at 50% 46%, transparent 32%, ${p.ground}DD 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 clamp(20px, 5vw, 64px)", pointerEvents: "none",
        }}
      >
        <div className="os-drop-in" style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 11, letterSpacing: ".28em", textTransform: "uppercase", color: mute, animationDelay: "1.9s", pointerEvents: "auto" }}>
          <i style={{ width: 7, height: 7, borderRadius: "50%", background: p.accent, display: "inline-block" }} />
          {p.eyebrow}
        </div>
        <h1
          style={{
            fontFamily: `'${p.displayFont}', sans-serif`, fontWeight: 800, fontSize: "clamp(64px, 15vw, 200px)", lineHeight: 0.8,
            letterSpacing: "-.05em", margin: "14px 0 0", fontVariantNumeric: "tabular-nums", textShadow: `0 0 70px ${p.accent2}8C`,
          }}
        >
          <span ref={cnt}>0</span>
          <em style={{ fontStyle: "normal", display: "block", fontSize: ".3em", letterSpacing: "-.02em", color: p.accent, marginTop: 10 }}>{p.unit}</em>
        </h1>
        <p className="os-drop-in" style={{ maxWidth: "40ch", margin: "26px 0 0", fontSize: "clamp(15px, 1.7vw, 18px)", lineHeight: 1.6, color: "#B5C4DC", animationDelay: "2.15s" }}>
          {p.sub}
        </p>
      </div>
      <div
        className="os-drop-in"
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 3, padding: "20px clamp(20px, 5vw, 64px)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap",
          fontFamily: "ui-monospace, 'IBM Plex Mono', monospace", fontSize: 11, color: mute, letterSpacing: ".1em",
          animationDelay: "2.4s", pointerEvents: "none",
        }}
      >
        <div><span ref={evn}>&mdash;</span> &middot; <b ref={evt} style={{ color: "#fff", fontWeight: 500 }} /></div>
        <div style={{ textAlign: "right" }}>
          <div ref={now} style={{ fontFamily: `'${p.displayFont}', sans-serif`, fontSize: "clamp(22px, 3.4vw, 38px)", fontWeight: 800, color: p.accent, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>0</div>
          <div style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", color: mute, marginTop: 6 }}>{p.hudLabel}</div>
        </div>
      </div>
    </div>
  );
}
