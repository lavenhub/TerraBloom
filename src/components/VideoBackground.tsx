"use client";

/**
 * VideoBackground
 *
 * WHY NO SCRUBBING:
 * Setting video.currentTime on every scroll event (or rAF) forces the
 * browser to decode a new keyframe every few milliseconds. That is
 * exactly what causes the stutter/lag you see. Browsers are not built
 * to seek 60 times per second.
 *
 * SOLUTION:
 * Let the video play() at a very slow playbackRate (0.35×).
 * A 30-second clip will take ~85 seconds to play through — plenty for
 * a full page scroll. The video runs on the GPU compositor thread,
 * completely separate from JS, so it is always silky smooth.
 *
 * The scroll progress bar is driven by a separate lightweight rAF loop
 * that only touches a single CSS property — that is fine.
 */

import { useEffect, useRef } from "react";

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const start = () => {
      video.playbackRate = 0.35;   // slow-motion — smooth as silk
      video.play().catch(() => {
        // Autoplay blocked (rare on muted video) — retry on first interaction
        const retry = () => { video.play().catch(() => {}); document.removeEventListener("click", retry); };
        document.addEventListener("click", retry, { once: true });
      });
    };

    if (video.readyState >= 3) {
      start();
    } else {
      video.addEventListener("canplay", start, { once: true });
    }

    // Scroll progress bar — cheap CSS-only update, no video seeking
    let rafId = 0;
    const updateBar = () => {
      const bar = document.getElementById("scroll-bar");
      if (bar) {
        const pct = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        bar.style.width = `${Math.min(pct * 100, 100)}%`;
      }
      rafId = requestAnimationFrame(updateBar);
    };
    rafId = requestAnimationFrame(updateBar);

    return () => {
      cancelAnimationFrame(rafId);
      video.pause();
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      background: "#000", overflow: "hidden",
    }}>
      <video
        ref={videoRef}
        src="/video/Living_city_in_landscape_202606201401.mp4"
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          opacity: 0.5,
          transform: "translateZ(0)",   // GPU layer
          willChange: "transform",
        }}
      />
      {/* Top + bottom gradient so nav and footer text stay readable */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 20%, transparent 72%, rgba(0,0,0,0.80) 100%)",
      }} />
    </div>
  );
}
