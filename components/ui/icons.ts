import {
  Activity,
  ArrowDownToLine,
  Bed,
  Bone,
  Box,
  Brain,
  CarFront,
  Droplet,
  Dumbbell,
  Gauge,
  Globe,
  HeartPulse,
  Hospital,
  Moon,
  Mountain,
  Radiation,
  RadioTower,
  Rocket,
  Satellite,
  Smile,
  Snowflake,
  Stethoscope,
  Sun,
  Tent,
  Thermometer,
  User,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { HazardId } from "@/content/risks";
import type { SteppeRisk } from "@/content/steppe";
import type { MissionEventKind } from "@/lib/data/dataset";
import type { Tier } from "@/lib/engine/types";
import type { AppState } from "@/lib/state/store";

/** One line-icon vocabulary for the whole app (lucide). Decorative: lucide renders aria-hidden. */

export const TIER_ICON: Record<Tier, LucideIcon> = { SELF: User, CMO: Stethoscope, EARTH: Globe };
/** Steppe ladder: self → family doctor → soum hospital / 103. */
export const TIER_ICON_STEPPE: Record<Tier, LucideIcon> = { SELF: User, CMO: Stethoscope, EARTH: Hospital };

export const ENV_ICON: Record<Exclude<AppState["environment"], "steppe">, LucideIcon> = {
  transit: Rocket,
  iss: Satellite,
  lunar: Moon,
  mars: Globe,
  rover: CarFront,
};

/** Mission Clock + chart event markers, per mode (a static lookup, so components stay stable across renders). */
export const EVENT_ICON: Record<"space" | "steppe", Record<MissionEventKind, LucideIcon>> = {
  space: { launch: Rocket, solar: Sun, drift: Brain, cardio: HeartPulse, bone: Bone, cold: Snowflake },
  steppe: { launch: Tent, solar: Sun, drift: Brain, cardio: HeartPulse, bone: Bone, cold: Snowflake },
};

export const HAZARD_ICON: Record<HazardId, LucideIcon> = {
  radiation: Radiation,
  isolation: Box,
  distance: RadioTower,
  gravity: ArrowDownToLine,
  environment: Wind,
};

export const STEPPE_RISK_ICON: Record<SteppeRisk["id"], LucideIcon> = {
  cold: Snowflake,
  altitude: Mountain,
  isolation: Tent,
  distance: Hospital,
};

/** Learn → indicator cards, keyed by card id. */
export const INDICATOR_CARD_ICON: Record<string, LucideIcon> = {
  heart: HeartPulse,
  bp: Gauge,
  spo2: Wind,
  glucose: Droplet,
  temperature: Thermometer,
  sleep: Bed,
  pvt: Zap,
  mood: Smile,
  exercise: Dumbbell,
  radiation: Radiation,
};

export const FALLBACK_ICON: LucideIcon = Activity;
