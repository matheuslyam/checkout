"use client"

import { useCheckout } from "@/store/CheckoutContext"
import { motion } from "framer-motion"
import { CheckCircle2, Package, Truck, Mail, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CheckoutSuccess() {
    const { state, reset } = useCheckout()

    const handleNewPurchase = () => {
        reset()
    }

    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
            {/* Success Animation */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="flex justify-center mb-6"
            >
                <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-8"
            >
                <h1 className="text-2xl font-bold text-white mb-2">
                    Pagamento Confirmado!
                </h1>
                <p className="text-zinc-400">
                    Seu pedido foi processado com sucesso
                </p>
            </motion.div>

            {/* Order Details */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 mb-8"
            >
                {/* Product */}
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Produto</p>
                            <p className="font-semibold text-white">AMBTUS FLASH</p>
                        </div>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Truck className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-zinc-400">Entrega em</p>
                            <p className="font-medium text-white">
                                {state.endereco}, {state.numero}
                            </p>
                            <p className="text-sm text-zinc-400">
                                {state.bairro} - {state.cidade}/{state.estado}
                            </p>
                            <p className="text-sm text-zinc-400">CEP: {state.cep}</p>
                        </div>
                    </div>
                </div>

                {/* Email Confirmation */}
                <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Mail className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Confirmação enviada para</p>
                            <p className="font-medium text-white">{state.email}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                {state.paymentId && (
                    <div className="p-3 bg-zinc-800/50 rounded-xl text-center">
                        <p className="text-xs text-zinc-500">
                            ID do Pagamento: {state.paymentId}
                        </p>
                    </div>
                )}
            </motion.div>

            {/* Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <Button
                    onClick={handleNewPurchase}
                    className="w-full h-14 rounded-2xl bg-[#1A7DFD] text-lg font-semibold hover:bg-[#1565CC] shadow-[0_0_20px_rgba(26,125,253,0.3)]"
                >
                    <Home className="w-5 h-5 mr-2" />
                    Voltar ao Início
                </Button>
            </motion.div>

            {/* Footer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs text-zinc-500 mt-6"
            >
                Obrigado por comprar conosco! 💙
            </motion.p>
        </div>
    )
}
