"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCheckout } from "@/store/CheckoutContext"
import { ArrowLeft, Loader2 } from "lucide-react"

import { usePayment } from "@/hooks/usePayment"
import { PaymentSelector } from "./checkout/PaymentSelector"
import { PixArea } from "./checkout/PixArea"
import { CardArea } from "./checkout/CardArea"

interface CheckoutPaymentProps {
    onBack: () => void
}

export function CheckoutPayment({ onBack }: CheckoutPaymentProps) {
    const { state, updateData, isHydrated } = useCheckout()
    const {
        isLoadingInstallments,
        isGeneratingPix,
        error,
        isPolling,
        handleGeneratePix
    } = usePayment()

    const handleSelectMethod = (method: 'pix' | 'cartao') => {
        updateData('metodoPagamento', method)
    }

    if (!isHydrated) {
        return (
            <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-32 mx-auto bg-zinc-800 rounded" />
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-20 bg-zinc-800 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md rounded-3xl bg-[#121212] p-8 shadow-2xl border border-white/5">
            {/* Header */}
            <h1 className="mb-2 text-center text-2xl font-bold text-white">
                Pagamento
            </h1>
            <p className="mb-6 text-center text-xs text-zinc-400">
                Escolha como deseja pagar
            </p>

            {/* Payment Method Selection */}
            {!state.paymentId && (
                <div className="space-y-6">
                    <PaymentSelector
                        method={state.metodoPagamento}
                        onSelect={handleSelectMethod}
                        frete={state.frete}
                    />

                    {/* CPF Input - Required for all payment methods */}
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm text-zinc-300">CPF do Pagador</label>
                        <Input
                            placeholder="000.000.000-00"
                            value={state.cpf}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '')
                                updateData('cpf', val)
                            }}
                            maxLength={11}
                            className={`h-12 border-[0.5px] bg-zinc-900/50 text-white placeholder:text-zinc-600 focus-visible:ring-[#3B82F6] rounded-xl ${state.cpf.length > 0 && state.cpf.length < 11
                                ? 'border-red-500'
                                : 'border-white/10'
                                }`}
                        />
                        {state.cpf.length > 0 && state.cpf.length < 11 && (
                            <p className="ml-1 text-xs text-red-400">CPF deve ter 11 números</p>
                        )}
                    </div>
                </div>
            )}

            {/* PIX Copy Code Section (No QR Code - Mobile First) */}
            {state.metodoPagamento === 'pix' && (
                <PixArea
                    pixPayload={state.pixPayload}
                    isPolling={isPolling}
                />
            )}

            {/* Card Form - Installment Selector */}
            {state.metodoPagamento === 'cartao' && !state.paymentId && (
                <CardArea
                    isLoading={isLoadingInstallments}
                    installments={state.installmentOptions}
                    selectedInstallment={state.parcelas}
                    onSelectInstallment={(val) => updateData('parcelas', val)}
                />
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="h-14 px-6 rounded-2xl border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                </Button>

                {state.metodoPagamento === 'pix' && !state.paymentId && (
                    <Button
                        onClick={handleGeneratePix}
                        disabled={isGeneratingPix || state.cpf.length !== 11}
                        className="flex-1 h-14 rounded-2xl bg-green-600 text-lg font-semibold hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPix ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Gerando PIX...
                            </span>
                        ) : (
                            'Gerar Código PIX'
                        )}
                    </Button>
                )}

                {state.metodoPagamento === 'cartao' && !state.paymentId && (
                    <Button
                        onClick={() => alert('Fluxo de cartão em desenvolvimento (Inputs removidos no refactor?)')}
                        disabled={state.cpf.length !== 11}
                        className="flex-1 h-14 rounded-2xl bg-[#1A7DFD] text-lg font-semibold hover:bg-[#1565CC] shadow-[0_0_20px_rgba(26,125,253,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuar com Cartão
                    </Button>
                )}
            </div>
        </div>
    )
}

