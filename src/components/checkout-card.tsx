"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bike, Truck, User } from "lucide-react"
import { useCheckout, CheckoutSkeleton } from "@/store/CheckoutContext"

export function CheckoutCard() {
    const { state, updateData, isHydrated } = useCheckout()

    // Show skeleton while hydrating to prevent flash of empty fields
    if (!isHydrated) {
        return (
            <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
                <CheckoutSkeleton />
            </div>
        )
    }

    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
            {/* Header */}
            <h1 className="mb-6 text-center text-2xl font-bold text-white">
                Finalizar Pedido
            </h1>

            {/* Product Image Placeholder */}
            <div className="relative mb-4 flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-white p-4">
                <div className="flex flex-col items-center gap-2">
                    <Bike className="h-24 w-24 text-zinc-900" strokeWidth={1} />
                    <span className="text-xs text-zinc-400">Bike Image</span>
                </div>
            </div>

            {/* Product Details */}
            <div className="space-y-1">
                <h2 className="text-center text-3xl font-bold uppercase tracking-wider text-[#3B82F6] drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                    AMBTUS FLASH
                </h2>
                <div className="flex items-center justify-between px-2 text-sm text-zinc-400">
                    <span>Edição Limitada</span>
                    <div className="flex items-center gap-2">
                        <span>Cor:</span>
                        <div className="h-4 w-4 rounded bg-black ring-1 ring-white/20" />
                    </div>
                </div>
            </div>

            {/* Price */}
            <div className="my-6 text-center">
                <span className="text-4xl font-bold text-white">R$ 12.490,00</span>
            </div>

            {/* Personal Data Form */}
            <div className="mb-8 space-y-5">
                <div className="flex items-center gap-2 text-[#3B82F6]">
                    <User className="h-5 w-5" />
                    <h3 className="font-semibold">Dados pessoais:</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Nome:</label>
                        <Input
                            placeholder="Ex: Pedro da Silva"
                            value={state.nome}
                            onChange={(e) => updateData('nome', e.target.value)}
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">E-mail:</label>
                        <Input
                            type="email"
                            placeholder="Ex: seugmail@gmail.com"
                            value={state.email}
                            onChange={(e) => updateData('email', e.target.value)}
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">CPF:</label>
                        <Input
                            placeholder="Ex: 12345678900"
                            value={state.cpf}
                            onChange={(e) => {
                                // Remove non-numeric characters
                                const numericValue = e.target.value.replace(/\D/g, '').slice(0, 11)
                                updateData('cpf', numericValue)
                            }}
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Button
                className="h-14 w-full rounded-2xl bg-[#1A7DFD] text-lg font-semibold hover:bg-[#1565CC] shadow-[0_0_20px_rgba(26,125,253,0.3)]"
            >
                Continuar para Entrega
                <Truck className="ml-2 h-5 w-5" />
            </Button>
        </div>
    )
}
