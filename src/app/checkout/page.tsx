'use client'

import { useCheckout, CheckoutSkeleton } from '@/store/CheckoutContext'
import { AnimatePresence } from 'framer-motion'
import {
    StepIdentificacao,
    StepEntrega,
    StepPagamento,
    OrderSummary,
    Stepper,
} from '@/components/checkout'

export default function CheckoutPage() {
    const { state, isHydrated } = useCheckout()

    const renderStep = () => {
        switch (state.step) {
            case 1:
                return <StepIdentificacao key="step-1" />
            case 2:
                return <StepEntrega key="step-2" />
            case 3:
                return <StepPagamento key="step-3" />
            default:
                return <StepIdentificacao key="step-1" />
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 dark:opacity-10" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {/* Header */}
                <header className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Checkout Seguro
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Complete sua compra em poucos passos
                    </p>
                </header>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Form Section */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 lg:p-10 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                            {/* Show skeleton while hydrating */}
                            {!isHydrated ? (
                                <CheckoutSkeleton />
                            ) : (
                                <>
                                    {/* Stepper */}
                                    <Stepper />

                                    {/* Step Content with Animation */}
                                    <AnimatePresence mode="wait">
                                        {renderStep()}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 order-1 lg:order-2">
                        <div className="lg:sticky lg:top-8">
                            <OrderSummary />
                        </div>
                    </div>
                </div>

                {/* Footer Trust */}
                <footer className="mt-12 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        🔒 Ambiente seguro • Seus dados estão protegidos
                    </p>
                </footer>
            </div>
        </main>
    )
}

