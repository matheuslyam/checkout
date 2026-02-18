import { motion } from "framer-motion";

export const PLUSH_COLORS = {
    TERRA_COTTA: "#E2725B",
    TURQUOISE: "#00CED1",
    CHROME: "linear-gradient(135deg, #E5E4E2 0%, #ffffff 50%, #999999 100%)",
    CHROME_DARK: "#666666" // For shadows/depth in metal
};

interface PlushBodyProps {
    children?: React.ReactNode;
}

export default function PlushBody({ children }: PlushBodyProps) {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* 
                Jaguar "Offset" Body Shape 
                Constructed using a main rectangle with specific border radii to create the "waist" and "hips".
                The Jaguar is known for its "leaned forward" look (asymmetrical waist).
             */}
            <div
                className="relative z-10"
                style={{
                    width: "18rem",
                    height: "22rem",
                    background: `radial-gradient(circle at 40% 30%, ${PLUSH_COLORS.TERRA_COTTA} 0%, #bf5b45 100%)`,
                    borderRadius: "45% 45% 48% 42% / 50% 50% 45% 45%", // Organic blob shape
                    transform: "rotate(-5deg)", // The "Offset" lean
                    boxShadow: `
                        inset 0 0 50px rgba(0,0,0,0.15), 
                        inset 10px 10px 20px rgba(255,255,255,0.1),
                        0 10px 30px rgba(0,0,0,0.2)
                    `
                }}
            >
                {/* Fur Texture Overlay */}
                <div
                    className="absolute inset-0 w-full h-full opacity-30 pointer-events-none rounded-[inherit]"
                    style={{
                        background: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')`,
                        mixBlendMode: 'overlay'
                    }}
                />

                {/* Upper Horn (Left - Thinner, longer) */}
                <div
                    className="absolute top-0 left-0 -translate-y-1/3 -translate-x-4 w-20 h-32 -rotate-12 z-0"
                    style={{
                        background: PLUSH_COLORS.TERRA_COTTA,
                        borderRadius: "50% 50% 20% 20%",
                        boxShadow: "inset -5px 0 10px rgba(0,0,0,0.1)"
                    }}
                />

                {/* Upper Horn (Right - Shorter, thicker) */}
                <div
                    className="absolute top-4 right-0 -translate-y-1/3 translate-x-2 w-24 h-28 rotate-12 z-0"
                    style={{
                        background: PLUSH_COLORS.TERRA_COTTA,
                        borderRadius: "50% 50% 30% 30%",
                        boxShadow: "inset 5px 0 10px rgba(0,0,0,0.1)"
                    }}
                />

                {/* Content Container (Face, Strings, etc.) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 transform rotate-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
