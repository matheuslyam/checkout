// src/lib/constants.ts
// Zero magic numbers — all visual & animation config lives here.

import type { StringNote } from "../types";

/** Total number of guitar strings */
export const STRING_COUNT = 6 as const;

/** Standard guitar tuning: E4, B3, G3, D3, A2, E2 (high to low) */
export const GUITAR_STRINGS: readonly StringNote[] = [
    { stringIndex: 0, frequency: 329.63, label: "E4" },
    { stringIndex: 1, frequency: 246.94, label: "B3" },
    { stringIndex: 2, frequency: 196.0, label: "G3" },
    { stringIndex: 3, frequency: 146.83, label: "D3" },
    { stringIndex: 4, frequency: 110.0, label: "A2" },
    { stringIndex: 5, frequency: 82.41, label: "E2" },
] as const;

/** String visual properties — thickness increases from high E to low E */
export const STRING_THICKNESS_PX: readonly number[] = [
    1.5, 2, 2.5, 3, 3.5, 4,
] as const;

// ─── Animation Constants ────────────────────────────────────
import { TargetAndTransition } from "framer-motion";

/** Idle breathing animation config (Y-axis translation) */
export const BREATHE_ANIMATION: TargetAndTransition = {
    y: [0, -4, 0],
    transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
    },
};

/** String vibration on strum (X-axis oscillation) */
export const VIBRATE_ANIMATION: TargetAndTransition = {
    x: [0, -3, 3, -2, 2, -1, 1, 0],
    transition: {
        duration: 0.15,
        ease: "easeOut",
    },
};

/** String glow effect on strum */
export const GLOW_ANIMATION: TargetAndTransition = {
    opacity: [0, 1, 0],
    transition: {
        duration: 0.4,
        ease: "easeOut",
    },
};

// ─── Layout Constants ───────────────────────────────────────
/** Guitar body dimensions (rem) */
export const GUITAR_BODY = {
    WIDTH_REM: 20,
    HEIGHT_REM: 32,
    NECK_HEIGHT_REM: 6,
    SOUNDHOLE_SIZE_REM: 8,
} as const;
