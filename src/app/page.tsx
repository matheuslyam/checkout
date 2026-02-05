"use client"

import { Step1Finalize } from "@/components/checkout/step-1-finalize"
import { CheckoutDelivery } from "@/components/checkout-delivery"
import { useCheckout } from "@/store/CheckoutContext"
import { AnimatePresence, motion } from "framer-motion"

export default function Home() {
    const { state, nextStep, goToStep } = useCheckout()

    return (
        <main className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
            <AnimatePresence mode="wait">
                {state.step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <Step1Finalize onNext={nextStep} />
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
