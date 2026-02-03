'use client'

import { useCheckout } from '@/store/CheckoutContext'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const STEPS = [
    { number: 1, label: 'Identificação' },
    { number: 2, label: 'Entrega' },
    { number: 3, label: 'Pagamento' },
]

export function Stepper() {
    const { state, goToStep } = useCheckout()

    return (
        <div className="flex items-center justify-between mb-10">
            {STEPS.map((step, index) => {
                const isActive = state.step === step.number
                const isCompleted = state.step > step.number
                const isClickable = step.number < state.step

                return (
                    <div key={step.number} className="flex items-center flex-1">
                        {/* Step Circle */}
                        <button
                            onClick={() => isClickable && goToStep(step.number as 1 | 2 | 3)}
                            disabled={!isClickable}
                            className={`relative flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all duration-300 ${isCompleted
                                    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                                    : isActive
                                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isCompleted ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                step.number
                            )}

                            {/* Pulse animation for active step */}
                            {isActive && (
                                <motion.span
                                    className="absolute inset-0 rounded-full bg-blue-400"
                                    initial={{ opacity: 0.5, scale: 1 }}
                                    animate={{ opacity: 0, scale: 1.5 }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </button>

                        {/* Step Label */}
                        <span className={`ml-3 text-sm font-medium hidden sm:block ${isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : isCompleted
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-400'
                            }`}>
                            {step.label}
                        </span>

                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                            <div className="flex-1 mx-4">
                                <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-green-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: isCompleted ? '100%' : '0%' }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
