'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Truck, Shield, Check } from 'lucide-react'
import { useCheckout } from '@/store/CheckoutContext'

const PRODUCT = {
    name: 'Bike Elétrica Ambtus',
    price: 6999.0,
    originalPrice: 8499.0,
    image: '/bike-placeholder.jpg',
    features: ['Motor 350W', 'Bateria 48V 13Ah', 'Autonomia 60km'],
}

export function OrderSummary() {
    const { state } = useCheckout()

    const discount = state.metodoPagamento === 'pix' ? PRODUCT.price * 0.05 : 0
    const finalPrice = PRODUCT.price - discount
    const frete = 0 // Frete grátis

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 lg:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resumo do Pedido
                </h3>
            </div>

            {/* Product */}
            <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center overflow-hidden">
                    <span className="text-3xl">🚴</span>
                </div>
                <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                        {PRODUCT.name}
                    </h4>
                    <ul className="mt-1 space-y-0.5">
                        {PRODUCT.features.map((feature, index) => (
                            <li key={index} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-500" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Prices */}
            <div className="space-y-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                    <span className="text-gray-900 dark:text-white">R$ {PRODUCT.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {discount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">Desconto PIX (5%)</span>
                        <span className="text-green-600 dark:text-green-400">- R$ {discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Frete</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">Grátis</span>
                </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        R$ {finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {state.metodoPagamento === 'cartao' && state.parcelas > 1 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            ou {state.parcelas}x de R$ {(finalPrice / state.parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    )}
                </div>
            </div>

            {/* Trust Badges */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <Truck className="w-4 h-4 text-green-500" />
                    <span>Entrega grátis para todo o Brasil</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>Garantia de 12 meses</span>
                </div>
            </div>

            {/* Progress */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Progresso</span>
                    <span>{state.step}/3</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${(state.step / 3) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>
        </motion.div>
    )
}
