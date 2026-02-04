"use client"

import { Button } from "@/components/ui/button"
import { useCheckout } from "@/store/CheckoutContext"
import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, QrCode, Copy, Check, Loader2, CreditCard, Clock } from "lucide-react"

interface CheckoutPaymentProps {
    onBack: () => void
}

// Polling interval in milliseconds
const POLLING_INTERVAL = 4000 // 4 seconds
const POLLING_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export function CheckoutPayment({ onBack }: CheckoutPaymentProps) {
    const { state, updateData, setPaymentResult, setPaymentStatus, nextStep, isHydrated } = useCheckout()

    const [isGeneratingPix, setIsGeneratingPix] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [isPolling, setIsPolling] = useState(false)

    const pollingRef = useRef<NodeJS.Timeout | null>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
    }, [])

    // Check payment status
    const checkPaymentStatus = useCallback(async () => {
        if (!state.paymentId) return

        try {
            const response = await fetch(`/api/asaas/check-payment/${state.paymentId}`)
            const data = await response.json()

            console.log(`[Polling] Payment ${state.paymentId} status: ${data.status}`)

            if (data.status === 'CONFIRMED') {
                console.log('[Polling] Payment CONFIRMED! Navigating to success...')
                setPaymentStatus('CONFIRMED')

                // Stop polling
                if (pollingRef.current) clearInterval(pollingRef.current)
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                setIsPolling(false)

                // Navigate to success screen
                nextStep()
            } else if (data.status === 'FAILED') {
                setPaymentStatus('FAILED')
                setError('Pagamento foi recusado ou expirou.')
                if (pollingRef.current) clearInterval(pollingRef.current)
                setIsPolling(false)
            }
        } catch (err) {
            console.error('[Polling] Error checking payment:', err)
        }
    }, [state.paymentId, setPaymentStatus, nextStep])

    // Start polling when we have a payment ID
    useEffect(() => {
        if (state.paymentId && state.paymentStatus === 'PENDING' && !isPolling) {
            setIsPolling(true)

            // Start polling
            pollingRef.current = setInterval(checkPaymentStatus, POLLING_INTERVAL)

            // Set timeout to stop polling after 15 minutes
            timeoutRef.current = setTimeout(() => {
                if (pollingRef.current) clearInterval(pollingRef.current)
                setIsPolling(false)
                setError('O QR Code expirou. Por favor, gere um novo.')
            }, POLLING_TIMEOUT)
        }
    }, [state.paymentId, state.paymentStatus, isPolling, checkPaymentStatus])

    // Generate PIX payment
    const handleGeneratePix = async () => {
        setIsGeneratingPix(true)
        setError(null)

        try {
            const response = await fetch('/api/asaas/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: 'ambtus-flash',
                    customer: {
                        name: state.nome,
                        email: state.email,
                        cpfCnpj: state.cpf.replace(/\D/g, ''),
                        phone: state.telefone?.replace(/\D/g, ''),
                    },
                    address: {
                        cep: state.cep.replace(/\D/g, ''),
                        endereco: state.endereco,
                        numero: state.numero,
                        complemento: state.complemento,
                        bairro: state.bairro,
                        cidade: state.cidade,
                        uf: state.estado,
                    },
                    paymentMethod: 'PIX',
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao gerar PIX')
            }

            // Set payment result in context
            setPaymentResult({
                paymentId: data.payment.id,
                pixQrCode: data.payment.pixQrCode?.encodedImage || '',
                pixPayload: data.payment.pixQrCode?.payload || '',
                pixExpiresAt: data.payment.pixQrCode?.expirationDate || '',
            })

            console.log('[Payment] PIX generated:', data.payment.id)

        } catch (err) {
            console.error('[Payment] Error generating PIX:', err)
            setError(err instanceof Error ? err.message : 'Erro ao gerar PIX')
        } finally {
            setIsGeneratingPix(false)
        }
    }

    // Copy PIX code
    const handleCopyPix = async () => {
        if (!state.pixPayload) return

        try {
            await navigator.clipboard.writeText(state.pixPayload)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            console.error('Failed to copy')
        }
    }

    // Select payment method
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
                <div className="space-y-4 mb-6">
                    {/* PIX Option */}
                    <button
                        type="button"
                        onClick={() => handleSelectMethod('pix')}
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${state.metodoPagamento === 'pix'
                                ? 'border-green-500 bg-green-900/20'
                                : 'border-white/10 bg-zinc-900/50 hover:border-white/20'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${state.metodoPagamento === 'pix' ? 'bg-green-500' : 'bg-zinc-800'
                            }`}>
                            <QrCode className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">PIX</span>
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-900/40 text-green-400 rounded-full">
                                    Aprovação Instantânea
                                </span>
                            </div>
                            <p className="text-sm text-zinc-400">
                                R$ {(state.frete + 12490).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
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
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 ${state.metodoPagamento === 'cartao'
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-white/10 bg-zinc-900/50 hover:border-white/20'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${state.metodoPagamento === 'cartao' ? 'bg-blue-500' : 'bg-zinc-800'
                            }`}>
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <span className="font-semibold text-white">Cartão de Crédito</span>
                            <p className="text-sm text-zinc-400">Em até 12x sem juros</p>
                        </div>
                        {state.metodoPagamento === 'cartao' && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                            </div>
                        )}
                    </button>
                </div>
            )}

            {/* PIX QR Code Display */}
            {state.metodoPagamento === 'pix' && state.pixQrCode && (
                <div className="mb-6 p-6 bg-zinc-900/50 rounded-2xl border border-white/5">
                    {/* QR Code */}
                    <div className="bg-white p-4 rounded-xl mx-auto w-fit mb-4">
                        <img
                            src={`data:image/png;base64,${state.pixQrCode}`}
                            alt="QR Code PIX"
                            className="w-48 h-48"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        {isPolling ? (
                            <>
                                <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                                <span className="text-sm text-green-400">Aguardando pagamento...</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4 text-zinc-400" />
                                <span className="text-sm text-zinc-400">QR Code válido por 15 minutos</span>
                            </>
                        )}
                    </div>

                    {/* Copy Button */}
                    <Button
                        onClick={handleCopyPix}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar código PIX
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Card Form Placeholder */}
            {state.metodoPagamento === 'cartao' && !state.paymentId && (
                <div className="mb-6 p-6 border-2 border-dashed border-zinc-700 rounded-2xl">
                    <p className="text-center text-zinc-400">
                        🔒 Integração com cartão será implementada em breve
                    </p>
                </div>
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
                        disabled={isGeneratingPix}
                        className="flex-1 h-14 rounded-2xl bg-green-600 text-lg font-semibold hover:bg-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50"
                    >
                        {isGeneratingPix ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Gerando PIX...
                            </span>
                        ) : (
                            'Gerar QR Code PIX'
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
