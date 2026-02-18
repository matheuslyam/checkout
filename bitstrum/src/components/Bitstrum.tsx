import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useVelocity } from "framer-motion";
import GuitarString from "./GuitarString";
import MessageDisplay from "./MessageDisplay";
import SpeechBubble from "./SpeechBubble";
import { BREATHE_ANIMATION, GUITAR_STRINGS, GUITAR_BODY } from "../lib/constants";
import { useHarmonicEngine } from "../hooks/useHarmonicEngine";
import { useMessageSystem } from "../hooks/useMessageSystem";
import { useHarmonicMemory } from "../hooks/useHarmonicMemory";
import { useBitstrumBrain } from "../hooks/useBitstrumBrain";

// Jagu-Axol Components
import PlushBody, { PLUSH_COLORS } from "./PlushBody";
import PlushFace from "./PlushFace";
import PlushLimb from "./PlushLimb";
import PlushGill from "./PlushGill";

/** Bitstrum — The Jagu-Axol Rockstar Plushie */
export default function Bitstrum() {
    const [activeString, setActiveString] = useState<number | null>(null);
    const { playNote } = useHarmonicEngine();
    const { currentMessage, triggerMessage } = useMessageSystem();
    const { recordNote, detectedSequence } = useHarmonicMemory();

    // 🧠 The Brain
    const {
        currentState,
        surrendered,
        registerInteraction,
        triggerShyMode,
        checkSleepyState,
        getSpeech
    } = useBitstrumBrain();

    // 🕵️ Debug: Prove Life
    useEffect(() => {
        // console.log(`[Bitstrum System] Brain State Changed: ${currentState} | Surrendered: ${surrendered}`);
    }, [currentState, surrendered]);

    const [speech, setSpeech] = useState<string | null>(null);

    // 🏃 Evasion Physics
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springConfig = { damping: 15, stiffness: 150, mass: 0.8 }; // Heavier "plush" feel
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    // Velocity for Limb Physics
    const velocityX = useVelocity(springX);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        return velocityX.on("change", (latest) => {
            setIsMoving(Math.abs(latest) > 5);
        });
    }, [velocityX]);

    // Gaze Tracking
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Timer refs to prevent spamming
    const shyDebounceRef = useRef<number>(0);

    // --- EFFECT: Sleepy State Checker ---
    useEffect(() => {
        checkSleepyState();
        const interval = setInterval(checkSleepyState, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [checkSleepyState]);

    // --- EFFECT: Random Speech Generation ---
    useEffect(() => {
        if (currentState === 'SLEEPY') return;

        // Try to speak every 15 seconds
        const loop = setInterval(() => {
            if (Math.random() > 0.6) {
                setSpeech(getSpeech());
                // Hide speech after 4 seconds
                setTimeout(() => setSpeech(null), 4000);
            }
        }, 15000);

        return () => clearInterval(loop);
    }, [currentState, getSpeech]);

    // --- EFFECT: React to Surrender ---
    useEffect(() => {
        if (surrendered) {
            setSpeech("Tá bom, você venceu! Pode me tocar... 🖤");
            // Reset position
            x.set(0);
            y.set(0);
        }
    }, [surrendered, x, y]);

    // Easter Egg Trigger (Legacy)
    useEffect(() => {
        if (detectedSequence) {
            triggerMessage(`msg-ee-${detectedSequence}`);
        }
    }, [detectedSequence, triggerMessage]);

    // 🖱️ Evasion Logic & Gaze Tracking
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // Track Gaze always
        setMousePos({ x: e.clientX, y: e.clientY });

        // If already surrendered, don't move
        if (surrendered || currentState === 'SLEEPY') {
            x.set(0);
            y.set(0);
            return;
        }

        // Calculate distance from center (Window center is safest assumption for now)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

        const THRESHOLD = 300; // Good balance

        if (dist < THRESHOLD) {
            // Move opposite to mouse
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const pushDistance = (THRESHOLD - dist) * 1.4;

            // Limit movement to avoid going off-screen too much
            const MAX_MOVE = 180;
            const moveX = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, -Math.cos(angle) * pushDistance));
            const moveY = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, -Math.sin(angle) * pushDistance));

            x.set(moveX);
            y.set(moveY);

            // Trigger "Attempt" count with throttle
            const now = Date.now();
            if (now - shyDebounceRef.current > 1200 && dist < 120) {
                triggerShyMode();
                shyDebounceRef.current = now;

                const complaint = getSpeech();
                setSpeech(complaint);
                setTimeout(() => setSpeech(null), 2000);
            }
        } else {
            // Return to center if safe
            x.set(0);
            y.set(0);
        }
    }, [currentState, surrendered, x, y, triggerShyMode, getSpeech]);

    const handleStrum = useCallback((stringIndex: number) => {
        setActiveString(stringIndex);
        registerInteraction(); // Tell brain we touched it

        // Trigger audio
        const note = GUITAR_STRINGS[stringIndex];
        if (note) {
            playNote(note.frequency);
            recordNote(stringIndex);
        }

        triggerMessage();

        const timer = window.setTimeout(() => {
            setActiveString((current) =>
                current === stringIndex ? null : current
            );
        }, 400);

        return () => window.clearTimeout(timer);
    }, [playNote, triggerMessage, recordNote, registerInteraction]);

    // Determine current mood for the face
    const getMood = () => {
        if (currentState === 'SLEEPY') return 'SLEEPY';
        if (surrendered) return 'SURRENDERED';
        if (currentState === 'SHY') return 'SHY';
        if (currentState === 'PLAYFUL') return 'PLAYFUL';
        return 'IDLE';
    };

    return (
        <div
            className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-transparent"
            onMouseMove={handleMouseMove}
        >
            <MessageDisplay message={currentMessage} />

            <motion.div
                animate={currentState === 'SLEEPY' ? { scale: 0.95, opacity: 0.8 } : BREATHE_ANIMATION}
                className="relative flex flex-col items-center select-none z-10"
                style={{
                    x: springX,
                    y: springY,
                    rotate: springX.get() * 0.05, // Slight tilt when moving
                }}
            >
                {/* 💬 The Voice */}
                <SpeechBubble text={speech} />

                {/* ─── JAGU-AXOL COMPOSITION ─── */}
                <PlushBody>
                    {/* Gills / Tuners */}
                    <PlushGill side="LEFT" hasPiercing />
                    <PlushGill side="RIGHT" />

                    {/* Limbs (Attached to body container) */}
                    <PlushLimb type="ARM" side="LEFT" isMoving={isMoving} />
                    <PlushLimb type="ARM" side="RIGHT" isMoving={isMoving} />
                    <PlushLimb type="LEG" side="LEFT" isMoving={isMoving} />
                    <PlushLimb type="LEG" side="RIGHT" isMoving={isMoving} />

                    {/* Face (Axolotl + Gaze) */}
                    <div className="mb-4">
                        <PlushFace mood={getMood()} mousePos={mousePos} />
                    </div>

                    {/* Guitar Strings (Overlay on Tummy) */}
                    <div
                        className="relative w-48 h-32 flex justify-center items-stretch pointer-events-auto mt-2"
                        style={{
                            gap: "var(--spacing-string-gap)",
                        }}
                    >
                        {/* Darker background for string visibility on Terra Cotta */}
                        <div className="absolute inset-0 bg-black/10 rounded-xl blur-sm -z-10" />

                        {GUITAR_STRINGS.map((note) => (
                            <GuitarString
                                key={note.stringIndex}
                                note={note}
                                onStrum={handleStrum}
                                isActive={activeString === note.stringIndex}
                            />
                        ))}
                    </div>

                    {/* Bridge */}
                    <div
                        className="w-32 h-3 mt-4 rounded-full shadow-sm"
                        style={{ background: PLUSH_COLORS.CHROME }}
                    />
                </PlushBody>
            </motion.div>
        </div>
    );
}
