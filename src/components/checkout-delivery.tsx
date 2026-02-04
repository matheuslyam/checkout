"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bike, Package } from "lucide-react"

interface CheckoutDeliveryProps {
    onNext: () => void;
}

export function CheckoutDelivery({ onNext }: CheckoutDeliveryProps) {
    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
            {/* Header */}
            <h1 className="mb-2 text-center text-2xl font-bold text-white">
                Entrega
            </h1>
            <p className="mb-6 text-center text-xs text-zinc-400">
                Onde sua bike vai ser entregue?
            </p>

            {/* Product Summary */}
            <div className="mb-8 flex items-center gap-4 rounded-2xl bg-zinc-900/30 p-4 border border-white/5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white p-2">
                    <Bike className="h-12 w-12 text-zinc-900" strokeWidth={1} />
                </div>
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-[#3B82F6]">
                        AMBTUS FLASH
                    </h2>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-400">
                        <span>Edição Limitada</span>
                        <div className="flex items-center gap-1">
                            <span>Cor:</span>
                            <div className="h-3 w-3 rounded bg-black ring-1 ring-white/20" />
                        </div>
                    </div>
                    <div className="mt-1">
                        <p className="text-sm font-medium text-white">Total a pagar: R$ 12.490,00</p>
                        <p className="text-xs font-bold text-[#3B82F6]">Até 12x de R$ 1.040,83</p>
                    </div>
                </div>
            </div>

            {/* Delivery Data Form */}
            <div className="mb-8 space-y-5">
                <div className="flex items-center gap-2 text-white">
                    <Package className="h-5 w-5" />
                    <h3 className="font-semibold">Dados de entrega:</h3>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">CEP</label>
                        <Input
                            placeholder="Ex: 12345-678"
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Endereço (Rua/Avenida)</label>
                        <Input
                            placeholder="Ex: Avenida Paulista"
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">Complemento</label>
                            <Input
                                placeholder="Ex: apto 102, bloco B"
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">Número</label>
                            <Input
                                placeholder="Ex: 123"
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Bairro</label>
                        <Input
                            placeholder="Ex: Bela Vista"
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Cidade / UF</label>
                        <Input
                            placeholder="Ex: São Paulo / SP"
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Button
                onClick={onNext}
                className="h-14 w-full rounded-2xl bg-[#1A7DFD] text-lg font-semibold hover:bg-[#1565CC] shadow-[0_0_20px_rgba(26,125,253,0.3)]"
            >
                Ir para o Pagamento
            </Button>
        </div>
    )
}
