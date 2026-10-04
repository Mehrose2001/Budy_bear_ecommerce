"use client";

import { useEffect, useRef, useState } from "react";

export default function useInfiniteMarquee({ speed = 0.55 } = {}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const hoveringRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const axisRef = useRef(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const resumeTimerRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const applyOffset = () => {
    const track = trackRef.current;
    if (!track) return;
    const half = track.scrollWidth / 2;
    if (half > 0) {
      while (-offsetRef.current >= half) offsetRef.current += half;
      while (offsetRef.current > 0) offsetRef.current -= half;
    }
    track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      pausedRef.current = true;
      setPaused(true);
    }

    let frame;
    const tick = () => {
      if (!pausedRef.current && !draggingRef.current && !hoveringRef.current) {
        offsetRef.current -= speed;
        applyOffset();
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const clearResume = () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const resumeSoon = () => {
      draggingRef.current = false;
      axisRef.current = null;
      clearResume();
      resumeTimerRef.current = setTimeout(() => {
        pausedRef.current = false;
        setPaused(false);
      }, 350);
    };

    const startDrag = (x, y) => {
      draggingRef.current = true;
      movedRef.current = false;
      axisRef.current = null;
      lastXRef.current = x;
      lastYRef.current = y;
      clearResume();
    };

    const moveDrag = (x, y, event) => {
      if (!draggingRef.current) return;
      const dx = x - lastXRef.current;
      const dy = y - lastYRef.current;
      if (!axisRef.current) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        axisRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      }
      if (axisRef.current !== "x") return;
      if (event.cancelable) event.preventDefault();
      movedRef.current = true;
      offsetRef.current += dx;
      lastXRef.current = x;
      lastYRef.current = y;
      applyOffset();
    };

    const onTouchStart = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      startDrag(touch.clientX, touch.clientY);
    };

    const onTouchMove = (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      moveDrag(touch.clientX, touch.clientY, event);
    };

    const onPointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      startDrag(event.clientX, event.clientY);
    };

    const onPointerMove = (event) => {
      if (event.pointerType !== "mouse") return;
      moveDrag(event.clientX, event.clientY, event);
    };

    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", resumeSoon, { passive: true });
    viewport.addEventListener("touchcancel", resumeSoon, { passive: true });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove, { passive: false });
    viewport.addEventListener("pointerup", resumeSoon);
    viewport.addEventListener("pointercancel", resumeSoon);

    return () => {
      clearResume();
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", resumeSoon);
      viewport.removeEventListener("touchcancel", resumeSoon);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", resumeSoon);
      viewport.removeEventListener("pointercancel", resumeSoon);
    };
  }, []);

  const onCardClick = (event) => {
    if (movedRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const onPointerEnter = (event) => {
    if (event.pointerType === "mouse") hoveringRef.current = true;
  };

  const onPointerLeave = () => {
    hoveringRef.current = false;
    draggingRef.current = false;
  };

  return {
    viewportRef,
    trackRef,
    paused,
    setPaused,
    onCardClick,
    onPointerEnter,
    onPointerLeave,
  };
}
