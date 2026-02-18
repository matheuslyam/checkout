// src/components/GuitarString.tsx
// Individual interactive guitar string with vibration and glow animations.

import { memo, useCallback, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { VIBRATE_ANIMATION, GLOW_ANIMATION, STRING_THICKNESS_PX } from "../lib/constants";
import type { StringNote } from "../types";

interface GuitarStringProps {
    readonly note: StringNote;
    readonly onStrum: (stringIndex: number) => void;
    readonly isActive: boolean;
}

const GuitarString = memo(function GuitarString({
    note,
    onStrum,
    isActive,
}: GuitarStringProps) {
    const [isVibrating, setIsVibrating] = useState(false);
    const vibrateControls = useAnimation();
    const glowControls = useAnimation();

    const thickness = STRING_THICKNESS_PX[note.stringIndex] ?? 2;

    const handleStrum = useCallback(async () => {
        if (isVibrating) return;

        setIsVibrating(true);
        onStrum(note.stringIndex);

        await Promise.all([
            vibrateControls.start(VIBRATE_ANIMATION),
            glowControls.start(GLOW_ANIMATION),
        ]);

        setIsVibrating(false);
    }, [isVibrating, onStrum, note.stringIndex, vibrateControls, glowControls]);

    return (
        <div
            className="relative flex flex-col items-center cursor-pointer select-none group"
            style={{ width: `var(--spacing-string-gap)` }}
            onMouseEnter={handleStrum}
            onTouchStart={handleStrum}
            role="button"
            tabIndex={0}
            aria-label={`String ${note.label}`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleStrum();
            }}
        >
            {/* Note label above string */}
            <span
                className="text-xs font-medium mb-2 transition-colors duration-300"
                style={{
                    fontFamily: "var(--font-family-display)",
                    color: isActive ? "var(--color-strum)" : "var(--color-text-muted)",
                }}
            >
                {note.label}
            </span>

            {/* String container */}
            <div className="relative h-full flex items-center justify-center">
                {/* Glow layer (behind the string) */}
                <motion.div
                    animate={glowControls}
                    initial={{ opacity: 0 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                        width: thickness + 8,
                        left: -(thickness + 8 - thickness) / 2,
                        background: `linear-gradient(180deg, transparent 0%, var(--color-strum) 30%, var(--color-strum) 70%, transparent 100%)`,
                        filter: "blur(4px)",
                    }}
                />

                {/* Physical string */}
                <motion.div
                    animate={vibrateControls}
                    className="rounded-full"
                    style={{
                        width: thickness,
                        height: "100%",
                        background: `linear-gradient(180deg, 
              var(--color-plushie-light) 0%, 
              var(--color-plushie) 20%, 
              var(--color-plushie-dark) 50%, 
              var(--color-plushie) 80%, 
              var(--color-plushie-light) 100%
            )`,
                        boxShadow: isActive
                            ? "var(--shadow-string-glow)"
                            : `0 0 ${thickness}px rgba(210, 105, 30, 0.2)`,
                        transition: "box-shadow var(--duration-glow) ease-out",
                    }}
                />
            </div>
        </div>
    );
});

export default GuitarString;
