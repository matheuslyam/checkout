import { motion, AnimatePresence } from "framer-motion";
import type { BitstrumMessage } from "../types";

interface MessageDisplayProps {
    message: BitstrumMessage | null;
}

export default function MessageDisplay({ message }: MessageDisplayProps) {
    return (
        <div className="absolute bottom-24 w-full flex justify-center pointer-events-none z-20 px-8">
            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shadow-xl max-w-md text-center"
                    >
                        <p
                            className="text-lg md:text-xl font-medium text-white/90 leading-relaxed"
                            style={{ fontFamily: "var(--font-family-display)" }}
                        >
                            {message.text}
                        </p>
                        {/* Optional category indicator if desired, kept subtle */}
                        <span className="text-[10px] uppercase tracking-widest text-white/30 mt-2 block">
                            {message.category}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
