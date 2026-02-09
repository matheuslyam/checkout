"use client"

import { Step1Finalize } from "@/components/checkout/step-1-finalize"
import { Step2Delivery } from "@/components/checkout/step-2-delivery"
import { Step3Payment } from "@/components/checkout/step-3-payment"
import { Step4Success } from "@/components/checkout/step-4-success"
import { useCheckout, CheckoutSkeleton } from "@/store/CheckoutContext"
import { AnimatePresence, motion } from "framer-motion"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { BIKES_CATALOG } from "@/lib/catalog"

export function CheckoutPageContent() {
    const { state, nextStep, prevStep, updateData, isHydrated } = useCheckout()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!isHydrated) return

        const rawBikeId = searchParams.get('bike_id') || searchParams.get('bike')
        const bikeId = rawBikeId?.toLowerCase()
        const color = searchParams.get('color')

        if (bikeId && BIKES_CATALOG[bikeId]) {
            const product = BIKES_CATALOG[bikeId]
            updateData('productId', product.id)
            updateData('productName', product.name)
            updateData('productPrice', product.price)
            updateData('productImage', product.image)
            updateData('productDescription', product.description)
            // Trigger recalculation of installments if needed by updating total or just relying on downstream components to read productPrice
        }

        if (color) {
            updateData('productColor', color)
        }
    }, [isHydrated, searchParams, updateData])

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
                        <Step3Payment onBack={prevStep} />
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
                        <Step4Success />
                    </motion.div>
                )
            default:
                return null
        }
    }

    // While hydrating, show skeleton to avoid layout shift and "blank screen" feel
    if (!isHydrated) {
        return (
            <div className="w-full flex justify-center max-w-[500px] mx-auto">
                <div className="w-full">
                    <CheckoutSkeleton />
                </div>
            </div>
        )
    }

    return (
        <AnimatePresence mode="wait">
            {renderStep()}
        </AnimatePresence>
    )
}
