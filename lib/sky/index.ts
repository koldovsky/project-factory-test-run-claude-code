// Public surface of the pure `lib/sky` modules (TC-PURE-01). App/component
// consumers import from here; the unit tests import the per-file modules
// (`./scene`, `./daynight`) directly. No next/react/DOM imports.

export type {
  ConditionScene,
  GradientKey,
  Particle,
  SkyScene,
  SkySceneInput,
} from "./types";
export { sceneForWeatherCode, skyScene } from "./scene";
export { isDaytime } from "./daynight";
export { localNow } from "./localNow";
