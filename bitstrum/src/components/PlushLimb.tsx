import { motion } from "framer-motion";
import { PLUSH_COLORS } from "./PlushBody";

interface PlushLimbProps {
    type: 'ARM' | 'LEG';
    side: 'LEFT' | 'RIGHT';
    isMoving: boolean;
}

export default function PlushLimb({ type, side, isMoving }: PlushLimbProps) {
    const isArm = type === 'ARM';
    const isLeft = side === 'LEFT';

    // Physics Animation Config with heavy inertia
    const danglingAnimation = {
        rotate: isMoving
            ? (isLeft ? [0, 25, -10, 15] : [0, -25, 10, -15])
            : 0,
        transition: {
            type: "spring",
            stiffness: 80,
            damping: 8, // Looser damping for "floppy" plush feel
            repeat: isMoving ? Infinity : 0,
            repeatType: "reverse" as const
        }
    };

    // Style config
    const baseClass = "absolute rounded-full shadow-md z-0 origin-top";

    // Arms attached to upper "shoulders" of the guitar body
    // Legs attached to bottom
    const positionStyle = isArm
        ? { top: "35%", [isLeft ? "left" : "right"]: "-2rem" }
        : { bottom: "-2.5rem", [isLeft ? "left" : "right"]: "3rem" };

    const sizeStyle = isArm
        ? { width: "3rem", height: "5rem" }
        : { width: "3.5rem", height: "6rem" };

    return (
        <motion.div
            className={baseClass}
            style={{
                ...positionStyle,
                ...sizeStyle,
                background: PLUSH_COLORS.TERRA_COTTA,
            }}
            animate={danglingAnimation}
        >
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-black/0 to-black/10 pointer-events-none" />

            {/* The Paw / Boot */}
            <div
                className={`absolute bottom-0 w-full ${isArm ? 'rounded-full' : 'rounded-b-2xl rounded-t-md'}`}
                style={{
                    height: "35%",
                    background: isArm ? "rgba(255,255,255,0.2)" : "#1a1a1a", // White paws or black boots
                    bottom: 0,
                    boxShadow: isArm ? "none" : "0 4px 6px rgba(0,0,0,0.3)" // Boot shadow
                }}
            >
                {/* Boot detail: White toe cap */}
                {!isArm && (
                    <div className="absolute bottom-0 w-full h-1/2 bg-white rounded-b-2xl opacity-90" />
                )}
            </div>
        </motion.div>
    );
}
