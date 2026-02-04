"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bike, Package, Loader2, Truck } from "lucide-react"
import { useCheckout } from "@/store/CheckoutContext"
import { useState, useEffect } from "react"

interface CheckoutDeliveryProps {
    onNext: () => void;
}

// Shipping cost by region
const ESTADOS_SUL_SUDESTE = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS']
const FRETE_SUL_SUDESTE = 150
const FRETE_OUTRAS_REGIOES = 300

function calcularFrete(uf: string): number {
    if (!uf) return 0
    const upperUf = uf.toUpperCase()
    return ESTADOS_SUL_SUDESTE.includes(upperUf) ? FRETE_SUL_SUDESTE : FRETE_OUTRAS_REGIOES
}

// Skeleton for loading state
function DeliverySkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 mx-auto bg-zinc-800 rounded" />
            <div className="h-4 w-48 mx-auto bg-zinc-800 rounded" />
            <div className="flex items-center gap-4 rounded-2xl bg-zinc-800/50 p-4 h-28" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 w-16 bg-zinc-800 rounded" />
                        <div className="h-12 w-full bg-zinc-800 rounded-xl" />
                    </div>
                ))}
            </div>
            <div className="h-14 w-full bg-zinc-800 rounded-2xl" />
        </div>
    )
}

export function CheckoutDelivery({ onNext }: CheckoutDeliveryProps) {
    const { state, updateData, isHydrated } = useCheckout()
    const [isLoadingCep, setIsLoadingCep] = useState(false)
    const [cepError, setCepError] = useState<string | null>(null)

    // Auto-search CEP when reaches 8 digits
    useEffect(() => {
        const buscarCep = async () => {
            const cepLimpo = state.cep.replace(/\D/g, '')
            if (cepLimpo.length !== 8) return

            setIsLoadingCep(true)
            setCepError(null)

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
                const data = await response.json()

                if (data.erro) {
                    setCepError('CEP não encontrado')
                    return
                }

                updateData('endereco', data.logradouro || '')
                updateData('bairro', data.bairro || '')
                updateData('cidade', data.localidade || '')
                updateData('estado', data.uf || '')

                // Calculate shipping based on state
                const freteCalculado = calcularFrete(data.uf)
                updateData('frete', freteCalculado)

            } catch (error) {
                console.error('Erro ao buscar CEP:', error)
                setCepError('Erro ao buscar CEP. Tente novamente.')
            } finally {
                setIsLoadingCep(false)
            }
        }

        buscarCep()
    }, [state.cep, updateData])

    // Check if all required fields are filled
    const allFieldsFilled =
        state.cep.replace(/\D/g, '').length === 8 &&
        state.endereco.length >= 5 &&
        state.numero.length >= 1 &&
        state.bairro.length >= 2 &&
        state.cidade.length >= 2 &&
        state.estado.length === 2

    const freteAtual = calcularFrete(state.estado)
    const isSulSudeste = state.estado && ESTADOS_SUL_SUDESTE.includes(state.estado.toUpperCase())

    // Show skeleton while hydrating
    if (!isHydrated) {
        return (
            <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
                <DeliverySkeleton />
            </div>
        )
    }

    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
            {/* Header */}
            <h1 className="mb-2 text-center text-2xl font-bold text-white">
                Entrega
            </h1>
            <p className="mb-6 text-center text-xs text-zinc-400">
                Onde sua bike vai ser entregue?
            </p>

            {/* Product Summary with Shipping */}
            <div className="mb-6 flex items-center gap-4 rounded-2xl bg-zinc-900/30 p-4 border border-white/5">
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

            {/* Shipping Info Box */}
            {state.estado.length === 2 && (
                <div className={`mb-6 p-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${isSulSudeste
                        ? 'bg-green-900/20 border border-green-800'
                        : 'bg-amber-900/20 border border-amber-800'
                    }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSulSudeste ? 'bg-green-900/40' : 'bg-amber-900/40'
                        }`}>
                        <Truck className={`w-5 h-5 ${isSulSudeste ? 'text-green-400' : 'text-amber-400'
                            }`} />
                    </div>
                    <div>
                        <p className={`font-semibold text-sm ${isSulSudeste ? 'text-green-300' : 'text-amber-300'
                            }`}>
                            Frete: R$ {freteAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${isSulSudeste ? 'text-green-400' : 'text-amber-400'
                            }`}>
                            {isSulSudeste ? 'Entrega em 10-15 dias úteis' : 'Entrega em 15-20 dias úteis'}
                        </p>
                    </div>
                </div>
            )}

            {/* Delivery Data Form */}
            <div className="mb-8 space-y-5">
                <div className="flex items-center gap-2 text-white">
                    <Package className="h-5 w-5" />
                    <h3 className="font-semibold">Dados de entrega:</h3>
                </div>

                <div className="space-y-4">
                    {/* CEP */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">CEP</label>
                        <div className="relative">
                            <Input
                                placeholder="00000000"
                                value={state.cep}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 8)
                                    updateData('cep', numericValue)
                                }}
                                maxLength={8}
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                            {isLoadingCep && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                </div>
                            )}
                        </div>
                        {cepError && (
                            <p className="text-xs text-red-400">{cepError}</p>
                        )}
                        <p className="text-[10px] text-zinc-500">Digite o CEP para buscar automaticamente</p>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Endereço (Rua/Avenida)</label>
                        <Input
                            placeholder="Ex: Avenida Paulista"
                            value={state.endereco}
                            onChange={(e) => updateData('endereco', e.target.value)}
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    {/* Complemento e Número */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">Complemento</label>
                            <Input
                                placeholder="Ex: apto 102"
                                value={state.complemento}
                                onChange={(e) => updateData('complemento', e.target.value)}
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">Número</label>
                            <Input
                                placeholder="Ex: 123"
                                value={state.numero}
                                onChange={(e) => updateData('numero', e.target.value)}
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Bairro */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">Bairro</label>
                        <Input
                            placeholder="Ex: Bela Vista"
                            value={state.bairro}
                            onChange={(e) => updateData('bairro', e.target.value)}
                            className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                        />
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">Cidade</label>
                            <Input
                                placeholder="Ex: São Paulo"
                                value={state.cidade}
                                onChange={(e) => updateData('cidade', e.target.value)}
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm text-zinc-300">UF</label>
                            <Input
                                placeholder="SP"
                                value={state.estado}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase().slice(0, 2)
                                    updateData('estado', value)
                                    if (value.length === 2) {
                                        updateData('frete', calcularFrete(value))
                                    }
                                }}
                                maxLength={2}
                                className="h-12 border-[0.5px] border-white/10 bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <Button
                onClick={onNext}
                disabled={!allFieldsFilled || isLoadingCep}
                className="h-14 w-full rounded-2xl bg-[#1A7DFD] text-lg font-semibold hover:bg-[#1565CC] shadow-[0_0_20px_rgba(26,125,253,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoadingCep ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Buscando CEP...
                    </span>
                ) : (
                    'Ir para o Pagamento'
                )}
            </Button>
        </div>
    )
}
