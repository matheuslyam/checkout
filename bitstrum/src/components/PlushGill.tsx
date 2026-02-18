import { motion } from "framer-motion";
import { PLUSH_COLORS } from "./PlushBody";

interface PlushGillProps {
    side: 'LEFT' | 'RIGHT';
    hasPiercing?: boolean;
}

export default function PlushGill({ side, hasPiercing }: PlushGillProps) {
    const isLeft = side === 'LEFT';

    // 3 Fronds per gill
    const fronds = [0, 1, 2];

    return (
        <div className={`absolute top-0 ${isLeft ? '-left-12' : '-right-12'} flex flex-col space-y-2`}>
            {fronds.map((i) => (
                <motion.div
                    key={i}
                    className="relative w-16 h-8 rounded-full shadow-sm origin-center"
                    style={{
                        backgroundColor: PLUSH_COLORS.TURQUOISE,
                        transform: `rotate(${isLeft ? -20 + (i * 10) : 20 - (i * 10)}deg) translateX(${isLeft ? '-50%' : '50%'})`,
                        boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)"
                    }}
                    animate={{
                        rotate: isLeft ? [-20 + (i * 10), -25 + (i * 10), -20 + (i * 10)] : [20 - (i * 10), 25 - (i * 10), 20 - (i * 10)],
                    }}
                    transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                >
                    {/* Tuning Peg Detail (Little cylinder at the base) */}
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-1' : 'left-1'} w-3 h-6 bg-gray-300 rounded-sm`}
                        style={{ background: PLUSH_COLORS.CHROME }}
                    />

                    {/* Piercings enabled only on specific fronds if requested */}
                    {hasPiercing && i === 1 && (
                        <div className="absolute right-2 top-0 w-3 h-3 rounded-full border-2 border-slate-300"
                            style={{ background: PLUSH_COLORS.CHROME_DARK, borderColor: "#fff" }}
                        />
                    )}
                    {hasPiercing && i === 2 && (
                        <div className="absolute right-4 bottom-0 w-2 h-2 rounded-full border-2 border-slate-300"
                            style={{ background: PLUSH_COLORS.CHROME_DARK, borderColor: "#fff" }}
                        />
                    )}
                </motion.div>
            ))}
        </div>
    );
}
