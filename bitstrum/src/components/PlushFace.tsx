import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PLUSH_COLORS } from "./PlushBody";

type Mood = 'IDLE' | 'SHY' | 'SURRENDERED' | 'SLEEPY' | 'PLAYFUL';

interface PlushFaceProps {
    mood: Mood;
    mousePos: { x: number, y: number };
}

export default function PlushFace({ mood, mousePos }: PlushFaceProps) {
    const [blink, setBlink] = useState(false);

    // Gaze Calculation
    // Calculate eye offset based on mouse position relative to window center
    // We dampen this so the eyes don't move too wildly
    const gazeX = (mousePos.x - window.innerWidth / 2) / 30;
    const gazeY = (mousePos.y - window.innerHeight / 2) / 30;

    // Clamp gaze
    const safeGazeX = Math.max(-10, Math.min(10, gazeX));
    const safeGazeY = Math.max(-5, Math.min(5, gazeY));

    // Random blinking logic
    useEffect(() => {
        if (mood === 'SLEEPY' || mood === 'SURRENDERED') return;

        const blinkLoop = () => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
            const nextBlink = Math.random() * 3000 + 2000; // 2-5 seconds
            timeoutId = setTimeout(blinkLoop, nextBlink);
        };

        let timeoutId = setTimeout(blinkLoop, 2000);
        return () => clearTimeout(timeoutId);
    }, [mood]);

    // Eye Variants
    const currentVariant = blink ? 'BLINK' : mood;

    return (
        <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none z-20 mt-8">
            {/* Eyes Container */}
            <div className="flex space-x-12 relative">
                {/* Left Eye */}
                <Eye variant={currentVariant} gaze={{ x: safeGazeX, y: safeGazeY }} />
                {/* Right Eye */}
                <Eye variant={currentVariant} gaze={{ x: safeGazeX, y: safeGazeY }} />

                {/* Blush - Axolotl style */}
                <div className="absolute -left-4 top-8 w-6 h-4 bg-pink-400 opacity-40 rounded-full blur-md" />
                <div className="absolute -right-4 top-8 w-6 h-4 bg-pink-400 opacity-40 rounded-full blur-md" />
            </div>

            {/* Snout Area & Piercing */}
            <div className="relative flex flex-col items-center">
                {/* Nose */}
                <motion.div
                    className="w-3 h-2 rounded-full bg-pink-300 opacity-60 shadow-sm mb-1"
                    animate={mood === 'PLAYFUL' ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                />

                {/* Mouth (Simple smile) */}
                <div className="w-6 h-3 border-b-2 border-slate-800 rounded-full opacity-40" />

                {/* SEPTUM PIERCING (Chrome Bull Ring) */}
                <motion.div
                    className="absolute top-3 w-4 h-4 rounded-full border-2"
                    style={{
                        borderColor: "#D1D5DB", // Light gray base
                        background: "transparent",
                        boxShadow: "0 2px 2px rgba(0,0,0,0.2)",
                    }}
                    // Add some swing physics to the piercing
                    animate={{ rotate: gazeX * 2 }}
                >
                    {/* Chrome reflection simulation */}
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-transparent border-t-white opacity-80" />
                </motion.div>
            </div>
        </div>
    );
}

function Eye({ variant, gaze }: { variant: string | Mood, gaze: { x: number, y: number } }) {
    const isClosed = variant === 'SLEEPY' || variant === 'BLINK' || variant === 'SURRENDERED';

    return (
        <div className="relative w-12 h-16 flex items-center justify-center">
            <motion.div
                className="w-full bg-black rounded-full overflow-hidden relative shadow-lg"
                variants={{
                    IDLE: { height: "4rem", scaleY: 1 },
                    PLAYFUL: { height: "4.2rem", scaleY: 1.05 },
                    SHY: { height: "3.5rem", scaleY: 0.9, rotate: 5 },
                    SURRENDERED: { height: "0.5rem", scaleY: 0.1, rotate: -15 }, // Squint
                    SLEEPY: { height: "0.2rem", scaleY: 0.05 },
                    BLINK: { height: "0.2rem", scaleY: 0.05 }
                }}
                animate={variant}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Eye Shine (Highlights) + Gaze Tracking */}
                {!isClosed && (
                    <motion.div
                        animate={{ x: gaze.x, y: gaze.y }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    >
                        <div className="absolute top-3 left-3 w-4 h-4 bg-white rounded-full opacity-90 blur-[0.5px]" />
                        <div className="absolute bottom-4 right-4 w-2 h-2 bg-white rounded-full opacity-50" />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
