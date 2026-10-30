"use client";

import { useEffect } from "react";

export default function IdleMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const elements = [...document.querySelectorAll<HTMLElement>("[data-idle-motion]")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("motion-offscreen", !entry.isIntersecting));
    }, { threshold: 0.01 });
    elements.forEach((element) => observer.observe(element));
    const updateVisibility = () => root.toggleAttribute("data-motion-paused", document.visibilityState === "hidden");
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      root.removeAttribute("data-motion-paused");
    };
  }, []);
  return null;
}
