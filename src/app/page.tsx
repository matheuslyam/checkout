"use client"

import { CheckoutCard } from "@/components/checkout-card"
import { CheckoutDelivery } from "@/components/checkout-delivery"
import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

export default function Home() {
    const [step, setStep] = useState(1)

    const handleNextStep = () => {
        setStep(2)
    }

    // Future: handleBackStep if needed

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-white">
            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <CheckoutCard onNext={handleNextStep} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <CheckoutDelivery onNext={() => console.log("Processing payment...")} />
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
