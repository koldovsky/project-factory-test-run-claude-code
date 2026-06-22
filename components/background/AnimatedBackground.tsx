import { skyScene, type SkyScene, type SkySceneInput } from "@/lib/sky";

// Animated background (FR-ANIM-01..04). A purely decorative, condition-driven
// layer behind all content.
//
// Server component: no interactivity and no browser APIs. The scene is resolved
// from pure `lib/sky` helpers at render time; the gradient is a CSS class and
// particles are CSS-animated elements (no WebGL, no audio, no canvas — spec
// "Animated background rendering exclusions"). Reduced-motion suppression and
// pointer pass-through are enforced in CSS (app/globals.css), so they hold even
// before hydration and never depend on JS.
//
// Accessibility / non-interference (FR-ANIM-04):
//   - `aria-hidden` + `role="presentation"`: never announced, no focus stop.
//   - no focusable children.
//   - `pointer-events-none` (here and on the layer's CSS) so clicks/taps/hovers
//     pass straight through to the content above it.
//   - `fixed inset-0 -z-10`: a full-viewport layer painted behind everything.
//
// Fail-calm (FR-ANIM fail-calm): `skyScene` is total, so missing/invalid input
// resolves to the neutral static gradient with no particles — never an error.

export interface AnimatedBackgroundProps {
  /** Raw scene inputs (weather code + sun times + location-local now). */
  scene?: SkySceneInput;
}

/** Number of particle elements per layer — bounded for perf (NFR-PERF-02). */
const PARTICLE_COUNT = 14;
const PARTICLE_INDICES = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);

export function AnimatedBackground({ scene }: AnimatedBackgroundProps) {
  const resolved: SkyScene = skyScene(scene ?? {});

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden sky-layer ${resolved.gradient}`}
    >
      {/* Theme veil: dims the (theme-independent) sky in dark mode so the page
          reads as dark; transparent in light mode (ADR-0007). Sits under the
          particles so they stay visible. */}
      <div className="sky-theme-veil" />
      {resolved.particle !== "none" ? (
        <div
          className={`pointer-events-none absolute inset-0 sky-particles sky-particles-${resolved.particle}`}
        >
          {PARTICLE_INDICES.map((index) => (
            <span
              key={index}
              className="sky-particle"
              style={{ "--i": index } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
