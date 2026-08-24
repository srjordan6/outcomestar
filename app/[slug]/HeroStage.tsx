"use client";

/**
 * app/[slug]/HeroStage.tsx — the showcase hero backdrop.
 *
 * One plate per entry on the record. The shape IS the data: a family six weeks
 * in gets something small and deliberate, a family six years in gets mass.
 * Nothing here is decorative filler.
 *
 * Three.js is loaded from CDN at runtime rather than bundled, so:
 *   - band_1_5 pages never request it (form "paper" returns before the loader)
 *   - it stays out of the server build entirely
 *   - a CDN failure degrades to a plain themed background, never a broken page
 *
 * Everything is guarded: no WebGL context, no THREE, reduced motion, tiny
 * records, zero entries. Each of those renders something sane.
 */

import { useEffect, useRef } from "react";
import type { HeroForm } from "@/lib/heroForm";

const THREE_SRC = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

function loadThree(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as any).THREE) return Promise.resolve((window as any).THREE);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-three]`);
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).THREE));
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = THREE_SRC;
    s.async = true;
    s.dataset.three = "1";
    s.onload = () => resolve((window as any).THREE);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export interface HeroStageProps {
  form: HeroForm;
  /** total entries on the record — becomes the plate count */
  entries: number;
  bg: string; accent: string; accent2: string; pop: string; base: string; mute: string;
  /** true when the theme ground is light: flips the lighting rig */
  light: boolean;
}

export default function HeroStage(p: HeroStageProps) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------------- paper: CSS only, no WebGL ever ---------------- */
    if (p.form === "paper") {
      const cols = [p.accent, p.accent2, p.pop, p.base];
      const nodes: HTMLDivElement[] = [];
      for (let i = 0; i < 10; i++) {
        const d = i / 9, size = 140 + ((i * 37) % 300);
        const n = document.createElement("div");
        n.style.cssText = `position:absolute;border-radius:52% 48% 46% 54%/55% 45% 55% 45%;
          width:${size}px;height:${size * 0.84}px;left:${(i * 37) % 92}%;top:${(i * 53) % 78}%;
          background:${cols[i % 4]};opacity:${(0.09 + d * 0.18).toFixed(2)};
          filter:blur(${((1 - d) * 9).toFixed(1)}px);will-change:transform`;
        el.appendChild(n); nodes.push(n);
      }
      if (reduce) return () => { nodes.forEach((n) => n.remove()); };
      const onMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
        nodes.forEach((n, i) => {
          const d = 0.2 + (i / 9) * 0.9;
          n.style.transform = `translate3d(${(-x * 46 * d).toFixed(1)}px,${(-y * 34 * d).toFixed(1)}px,0)`;
        });
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      return () => { window.removeEventListener("mousemove", onMove); nodes.forEach((n) => n.remove()); };
    }

    /* ---------------- webgl forms ---------------- */
    let stop = false;
    let cleanup: (() => void) | null = null;

    loadThree().then((THREE) => {
      if (stop || !THREE || !el) return;
      // a record with nothing in it has no shape to show
      const N = Math.max(24, Math.min(p.entries || 0, 4000));
      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch (err) { return; }   // no WebGL context: leave the themed background alone

      const W = () => el.clientWidth || 1, H = () => el.clientHeight || 1;
      const dark = !p.light;
      const hex = (c: string) => parseInt(c.replace("#", "").slice(0, 6), 16) || 0x888888;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(hex(p.bg), p.form === "orbit" ? 0.036 : 0.052);
      const cam = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 200);
      cam.position.set(0, 2.2, 17);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W(), H());
      el.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, dark ? 0.55 : 1.15));
      const k = new THREE.DirectionalLight(0xbfd8f0, dark ? 1.5 : 1.05); k.position.set(-6, 11, 7); scene.add(k);
      const r = new THREE.DirectionalLight(hex(p.accent), dark ? 1.9 : 0.85); r.position.set(7, 2, -9); scene.add(r);
      const l = new THREE.PointLight(hex(p.accent2), dark ? 1.5 : 0.65, 26); l.position.set(3, -5, 4); scene.add(l);

      const geo = new THREE.BoxGeometry(1, p.form === "tower" ? 0.038 : 0.03, 1);
      const mat = new THREE.MeshStandardMaterial({
        metalness: dark ? 0.28 : 0.06, roughness: dark ? 0.42 : 0.62, vertexColors: true,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, N);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const col = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3);
      const cB = new THREE.Color(p.base), cH = new THREE.Color(p.accent),
            cC = new THREE.Color(p.accent2), cG = new THREE.Color(p.pop);
      type Plate = { y: number; w: number; rot: number; rad: number; t: number };
      const P: Plate[] = [];
      for (let i = 0; i < N; i++) {
        const t = N > 1 ? i / (N - 1) : 0;
        let y: number, w: number, rot: number, rad = 0;
        if (p.form === "column") {
          y = -5.6 + t * 11.6;
          w = 1.5 + t * 2.1 + 0.3 * Math.sin(t * 34) + 0.16 * Math.sin(t * 11.3);
          rot = t * 7.4 + Math.sin(t * 20) * 0.16;
        } else if (p.form === "tower") {
          y = -5.4 + t * 11.2;
          w = 3.05 - Math.abs(t - 0.42) * 2.05 + 0.22 * Math.sin(t * 29);
          rot = Math.round(t * 9) * (Math.PI / 7);
        } else {
          y = -4.6 + t * 9.4 + Math.sin(t * 13) * 0.5;
          w = 0.85 + 0.55 * Math.sin(t * 7);
          rot = t * 22; rad = 3.0 + 2.4 * Math.sin(t * 4.1);
        }
        P.push({ y, w: Math.max(0.15, w), rot, rad, t });
        const c = cB.clone();
        if (t > 0.965) c.lerp(cG, 0.92);
        else if (t > 0.87) c.lerp(cH, 0.55);
        else if (Math.sin(t * 34) > 0.93) c.lerp(cC, 0.6);
        col.setXYZ(i, c.r, c.g, c.b);
      }
      geo.setAttribute("color", col);
      scene.add(mesh);

      const dn = 150, dp = new Float32Array(dn * 3);
      for (let d = 0; d < dn; d++) {
        dp[d * 3] = (Math.random() - 0.5) * 30;
        dp[d * 3 + 1] = (Math.random() - 0.5) * 22;
        dp[d * 3 + 2] = (Math.random() - 0.5) * 18;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
      scene.add(new THREE.Points(dg, new THREE.PointsMaterial({
        color: hex(p.mute), size: 0.035, transparent: true, opacity: dark ? 0.5 : 0.3, depthWrite: false,
      })));

      const dum = new THREE.Object3D(), clock = new THREE.Clock();
      let entry = 0, mx = 0, my = 0, tmx = 0, tmy = 0, sN = 0;

      const onMove = (e: MouseEvent) => {
        tmx = e.clientX / window.innerWidth - 0.5;
        tmy = e.clientY / window.innerHeight - 0.5;
      };
      const onScroll = () => { sN = Math.min(window.scrollY / window.innerHeight, 1.4); };
      const onResize = () => {
        cam.aspect = W() / H(); cam.updateProjectionMatrix(); renderer.setSize(W(), H());
      };
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);

      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        if (entry < 1) entry = Math.min(entry + dt * 0.42, 1);
        mx += (tmx - mx) * 0.055; my += (tmy - my) * 0.055;
        const spin = clock.elapsedTime * 0.075 + sN * 2.3 + mx * 0.55;
        for (let i = 0; i < N; i++) {
          const q = P[i];
          const a = reduce ? 1 : Math.max(0, Math.min((entry * 1.35 - q.t * 0.35) / 0.65, 1));
          const e = 1 - Math.pow(1 - a, 3);
          const ang = q.rot + spin;
          if (q.rad) dum.position.set(Math.cos(ang) * q.rad * e, q.y * e - (1 - e) * 7, Math.sin(ang) * q.rad * e);
          else dum.position.set(0, q.y * e - (1 - e) * 7, 0);
          dum.rotation.y = ang; dum.rotation.x = my * 0.16;
          const s = q.w * e; dum.scale.set(s, 1, s);
          dum.updateMatrix(); mesh.setMatrixAt(i, dum.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        cam.position.y = 2.2 + sN * 5.4 + my * 0.9;
        cam.position.x = mx * 2.2;
        cam.position.z = 17 - sN * 3.6;
        cam.lookAt(0, 1.2 + sN * 4.6, 0);
        renderer.render(scene, cam);
      };

      if (reduce) { entry = 1; frame(); }
      else renderer.setAnimationLoop(frame);   // pauses itself when the tab is hidden

      cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        renderer.setAnimationLoop(null);
        geo.dispose(); mat.dispose(); dg.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      };
    }).catch(() => { /* CDN unreachable: the themed background stands on its own */ });

    return () => { stop = true; if (cleanup) cleanup(); };
  }, [p.form, p.entries, p.bg, p.accent, p.accent2, p.pop, p.base, p.mute, p.light]);

  return <div ref={host} aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }} />;
}
