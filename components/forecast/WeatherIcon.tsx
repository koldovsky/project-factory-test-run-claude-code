import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  HelpCircle,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { weatherCodeToCondition } from "@/lib/weather";
import { cn } from "@/lib/utils";

// Weather-code → icon (FR-FORECAST-02). Server component: pure presentation.
//
// The stable icon KEY and the Ukrainian condition LABEL come from the pure
// `weatherCodeToCondition` mapper (lib/weather); this component only binds each
// key to a lucide glyph and exposes the Ukrainian label as the icon's accessible
// alternative text (`role="img"` + `aria-label`). The glyph itself is decorative
// (`aria-hidden`), so the condition is announced exactly once, in Ukrainian.

const ICON_BY_KEY: Record<string, LucideIcon> = {
  clear: Sun,
  "mainly-clear": CloudSun,
  "partly-cloudy": CloudSun,
  overcast: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  "rain-showers": CloudRain,
  "snow-showers": Snowflake,
  thunderstorm: CloudLightning,
  "thunderstorm-hail": CloudLightning,
  unknown: HelpCircle,
};

export interface WeatherIconProps {
  weatherCode: number;
  className?: string;
}

export function WeatherIcon({ weatherCode, className }: WeatherIconProps) {
  const { icon, label } = weatherCodeToCondition(weatherCode);
  const Glyph = ICON_BY_KEY[icon] ?? HelpCircle;

  return (
    <span role="img" aria-label={label} className={cn("inline-flex", className)}>
      <Glyph aria-hidden="true" className="size-8 text-foreground" />
    </span>
  );
}
