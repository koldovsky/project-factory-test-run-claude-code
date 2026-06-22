"use client";

import { useEffect, useRef } from "react";

// The active city's <h1> (BUG-005, NFR-A11Y-01). Client component so it can move
// keyboard/screen-reader focus to itself after a soft navigation to a new
// location — otherwise the focused control (a search suggestion, "make active",
// or a map click) unmounts and focus is dropped to <body>, leaving keyboard/SR
// users with no idea the page changed. tabIndex={-1} makes it a programmatic
// focus target; focusing it programmatically does not trigger :focus-visible, so
// no focus ring flashes for mouse users. preventScroll keeps the viewport steady.

export function CityHeading({ name }: { name: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [name]);

  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className="w-fit rounded-md bg-background/80 px-3 py-1 text-2xl font-semibold tracking-tight text-foreground outline-none backdrop-blur-sm"
    >
      {name}
    </h1>
  );
}
