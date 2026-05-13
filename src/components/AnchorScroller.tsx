"use client";

import { useEffect } from "react";

// A component that, when included on a page, scrolls to the element
// indicated by the URL hash (if any) after the page loads. While the
// browser normally does this automatically, it does so too early in
// our case, before the layout settles, resulting in incorrect scroll
// positions.
export function AnchorScroller() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      return;
    }

    const el = document.querySelector(hash);
    if (!el) {
      return;
    }

    // Wait for layout to settle using two wrapped requestAnimationFrame calls.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "start" });
      });
    });
  }, []);

  return null;
}
