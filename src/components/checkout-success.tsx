"use client"

import { useCheckout } from "@/store/CheckoutContext"
import { motion } from "framer-motion"
import { Check, Package, Truck, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useRef } from "react"

// WhatsApp number for order tracking
const WHATSAPP_NUMBER = "5511999999999" // Replace with actual number

export function CheckoutSuccess() {
    const { state, reset } = useCheckout()
    const hasCleanedUp = useRef(false)

    // Clear sessionStorage after showing success (only once)
    useEffect(() => {
        if (!hasCleanedUp.current && state.paymentStatus === 'CONFIRMED') {
            hasCleanedUp.current = true

            // Delay cleanup to ensure the UI renders first
            const timer = setTimeout(() => {
                // Clear checkout data from sessionStorage
                sessionStorage.removeItem('checkout_state')
                console.log('[Success] Checkout state cleared from sessionStorage')
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [state.paymentStatus])

    // Generate WhatsApp link
    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `Olá! Acabei de fazer uma compra na Ambtus. 🚴\n\n` +
            `Pedido: ${state.paymentId}\n` +
            `Produto: AMBTUS FLASH\n` +
            `Endereço: ${state.endereco}, ${state.numero} - ${state.cidade}/${state.estado}\n\n` +
            `Gostaria de acompanhar meu pedido!`
        )
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank')
    }

    // Handle new purchase (full reset)
    const handleNewPurchase = () => {
        reset()
    }

    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5 overflow-hidden">
            {/* Apple-style Check Animation */}
            <div className="flex justify-center mb-8">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.1
                    }}
                    className="relative"
                >
                    {/* Outer Ring with Glow */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-green-600 p-1 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                    >
                        <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center">
                            {/* Animated Check Mark */}
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20,
                                    delay: 0.4
                                }}
                            >
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                    <motion.div
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.5, delay: 0.6 }}
                                    >
                                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Sparkle Effects */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                            transition={{
                                duration: 1,
                                delay: 0.6 + (i * 0.1),
                                ease: "easeOut"
                            }}
                            className="absolute w-2 h-2 bg-green-400 rounded-full"
                            style={{
                                top: `${50 + 55 * Math.sin(i * Math.PI / 3)}%`,
                                left: `${50 + 55 * Math.cos(i * Math.PI / 3)}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-8"
            >
                <h1 className="text-2xl font-bold text-white mb-2">
                    Pagamento Confirmado!
                </h1>
                <p className="text-zinc-400">
                    Sua AMBTUS FLASH está a caminho 🚴
                </p>
            </motion.div>

            {/* Transaction Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 mb-8"
            >
                {/* Product */}
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-400">Produto</p>
                        <p className="font-semibold text-white truncate">AMBTUS FLASH - Edição Limitada</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="font-bold text-white">
                            R$ {(state.frete + 12490).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Delivery */}
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-400">Entrega em</p>
                        <p className="font-medium text-white truncate">
                            {state.endereco}, {state.numero}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                            {state.bairro} - {state.cidade}/{state.estado}
                        </p>
                    </div>
                </div>

                {/* Order ID */}
                {state.paymentId && (
                    <div className="py-2 px-4 bg-zinc-800/50 rounded-xl text-center">
                        <p className="text-xs text-zinc-500">
                            Código do pedido: <span className="font-mono text-zinc-400">{state.paymentId}</span>
                        </p>
                    </div>
                )}
            </motion.div>

            {/* WhatsApp CTA - Main Action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-4"
            >
                <Button
                    onClick={handleWhatsApp}
                    className="w-full h-14 rounded-2xl bg-[#25D366] text-lg font-semibold hover:bg-[#20BD5A] shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all"
                >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Acompanhar no WhatsApp
                </Button>

                <button
                    onClick={handleNewPurchase}
                    className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    Fazer nova compra
                </button>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8 pt-6 border-t border-white/5 text-center"
            >
                <p className="text-xs text-zinc-600">
                    Um comprovante foi enviado para <span className="text-zinc-400">{state.email}</span>
                </p>
            </motion.div>
        </div>
    )
}
