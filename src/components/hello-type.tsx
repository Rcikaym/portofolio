"use client";

import { useEffect, useState } from "react";
import {
  isFullWord,
  longestRole,
  startState,
  typeStep,
  typedText,
  type TypeState,
} from "@/lib/type-role";

export function HelloType() {
  const [state, setState] = useState<TypeState>(startState);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = startState();
    let remaining = typeStep(current).wait;
    let last = performance.now();
    let dead = false;
    let raf = 0;

    const frame = (now: number) => {
      if (dead) return;
      raf = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      if (motion.matches || document.hidden) return;
      remaining -= dt;
      if (remaining > 0) return;
      const { next, wait } = typeStep(current);
      current = next;
      remaining = wait;
      setState(next);
    };

    const onMotion = () => {
      if (motion.matches) {
        current = startState();
        remaining = typeStep(current).wait;
        setState(current);
      }
    };

    const onVis = () => {
      if (!document.hidden) last = performance.now();
    };

    if (!motion.matches) raf = requestAnimationFrame(frame);
    motion.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      motion.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const busy = !isFullWord(state);

  return (
    <h1>
      <span className="sr-only">Hello. I&apos;m Fadlan.</span>
      <span className="hello" aria-hidden="true">
        <span className="hello__sizer">Hello. I&apos;m {longestRole()}▮</span>
        <span className="hello__live">
          Hello. I&apos;m {typedText(state)}{"\u2060"}<span className={busy ? "caret is-busy" : "caret"}>▮</span>
        </span>
      </span>
    </h1>
  );
}
