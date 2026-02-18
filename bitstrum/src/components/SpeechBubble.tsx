import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
    text: string | null;
}

export default function SpeechBubble({ text }: SpeechBubbleProps) {
    return (
        <AnimatePresence>
            {text && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10, x: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute -top-20 -right-24 z-50 max-w-[200px]"
                >
                    <div className="bg-white text-black px-4 py-3 rounded-2xl rounded-bl-none shadow-xl border-2 border-black font-medium text-sm">
                        {text}
                    </div>
                    {/* Tail */}
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        className="absolute -bottom-3 left-0 text-white fill-current drop-shadow-md"
                        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
                    >
                        <path d="M0 0 L0 20 L20 0 Z" stroke="black" strokeWidth="2" />
                        <path d="M2 0 L2 16 L18 0 Z" className="text-white fill-current" stroke="none" />
                    </svg>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
