'use client'

import { useCheckout } from '@/store/CheckoutContext'

export default function Home() {
    const { state, nextStep, prevStep, updateData } = useCheckout()

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold mb-6">Checkout - Step {state.step}</h1>

                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Estado atual do checkout carregado com sucesso!
                    </p>

                    <div className="flex gap-4">
                        <button
                            onClick={prevStep}
                            disabled={state.step === 1}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
                        >
                            Voltar
                        </button>
                        <button
                            onClick={nextStep}
                            disabled={state.step === 3}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
