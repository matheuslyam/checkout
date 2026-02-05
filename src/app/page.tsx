"use client"

import { Step1Finalize } from "@/components/checkout/step-1-finalize"
import { Step2Delivery } from "@/components/checkout/step-2-delivery"
import { CheckoutPayment } from "@/components/checkout-payment"
import { CheckoutSuccess } from "@/components/checkout-success"
import { useCheckout } from "@/store/CheckoutContext"
import { AnimatePresence, motion } from "framer-motion"

export default function Home() {
    const { state, nextStep, prevStep } = useCheckout()

    const renderStep = () => {
        switch (state.step) {
            case 1:
                return (
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
                )
            case 2:
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <Step2Delivery onNext={nextStep} onBack={prevStep} />
                    </motion.div>
                )
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full flex justify-center"
                    >
                        <CheckoutPayment onBack={prevStep} />
                    </motion.div>
                )
            case 4:
                return (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="w-full flex justify-center"
                    >
                        <CheckoutSuccess />
                    </motion.div>
                )
            default:
                return null
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#050505] p-4 text-white">
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </main>
    )
}
