'use client'

import { useCheckout, type MetodoPagamento } from '@/store/CheckoutContext'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ArrowLeft, CreditCard, QrCode, Check, Lock } from 'lucide-react'

const PARCELAS_OPTIONS = [
    { value: 1, label: '1x de R$ 6.999,00 sem juros' },
    { value: 2, label: '2x de R$ 3.499,50 sem juros' },
    { value: 3, label: '3x de R$ 2.333,00 sem juros' },
    { value: 6, label: '6x de R$ 1.166,50 sem juros' },
    { value: 10, label: '10x de R$ 699,90 sem juros' },
    { value: 12, label: '12x de R$ 583,25 sem juros' },
    { value: 21, label: '21x de R$ 333,29 sem juros' },
]

export function StepPagamento() {
    const { state, updateData, prevStep } = useCheckout()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSelectMethod = (method: MetodoPagamento) => {
        updateData('metodoPagamento', method)
    }

    const handleSelectParcelas = (parcelas: number) => {
        updateData('parcelas', parcelas)
    }

    const handleFinalizarCompra = async () => {
        setIsProcessing(true)
        // TODO: Integrar com AsaasService
        console.log('Finalizando compra...', state)
        setTimeout(() => {
            setIsProcessing(false)
            alert('Pagamento processado! (simulação)')
        }, 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Pagamento
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Escolha a forma de pagamento
                </p>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4 mb-8">
                {/* PIX Option */}
                <button
                    type="button"
                    onClick={() => handleSelectMethod('pix')}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${state.metodoPagamento === 'pix'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${state.metodoPagamento === 'pix'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white">PIX</span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full">
                                5% OFF
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Aprovação instantânea
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-green-600 dark:text-green-400">R$ 6.649,05</p>
                        <p className="text-xs text-gray-500 line-through">R$ 6.999,00</p>
                    </div>
                    {state.metodoPagamento === 'pix' && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}
                </button>

                {/* Card Option */}
                <button
                    type="button"
                    onClick={() => handleSelectMethod('cartao')}
                    className={`w-full p-5 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${state.metodoPagamento === 'cartao'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${state.metodoPagamento === 'cartao'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="flex-1 text-left">
                        <span className="font-semibold text-gray-900 dark:text-white">Cartão de Crédito</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Em até 21x sem juros
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">R$ 6.999,00</p>
                    </div>
                    {state.metodoPagamento === 'cartao' && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    )}
                </button>
            </div>

            {/* Card Installments */}
            {state.metodoPagamento === 'cartao' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8"
                >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Parcelas
                    </label>
                    <select
                        value={state.parcelas}
                        onChange={(e) => handleSelectParcelas(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                        {PARCELAS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    {/* Card Form Placeholder */}
                    <div className="mt-6 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            🔒 Formulário de cartão será integrado com Asaas Tokenization
                        </p>
                    </div>
                </motion.div>
            )}

            {/* PIX QR Code Placeholder */}
            {state.metodoPagamento === 'pix' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8"
                >
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-center">
                        <div className="w-48 h-48 mx-auto bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4">
                            <QrCode className="w-24 h-24 text-gray-300 dark:text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            QR Code será gerado ao confirmar
                        </p>
                    </div>
                </motion.div>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 text-gray-500 dark:text-gray-400">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Pagamento 100% seguro via Asaas</span>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <button
                    type="button"
                    onClick={handleFinalizarCompra}
                    disabled={!state.metodoPagamento || isProcessing}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isProcessing ? 'Processando...' : 'Finalizar Compra'}
                </button>
            </div>
        </motion.div>
    )
}
