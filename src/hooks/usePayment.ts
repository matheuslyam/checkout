import { useState, useEffect, useRef, useCallback } from "react"
import { useCheckout } from "@/store/CheckoutContext"
import { useCheckoutToast } from "@/components/ui/CheckoutToast"

// Polling interval in milliseconds
const POLLING_INTERVAL = 4000 // 4 seconds
const POLLING_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export function usePayment() {
    const { state, updateData, setPaymentResult, setPaymentStatus, setInstallmentOptions, nextStep } = useCheckout()
    const { showToast } = useCheckoutToast()

    const [isLoadingInstallments, setIsLoadingInstallments] = useState(false)
    const [isGeneratingPix, setIsGeneratingPix] = useState(false)
    const [error, setError] = useState<string | null>(null)
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

    // Fetch installment options
    useEffect(() => {
        const fetchInstallments = async () => {
            setIsLoadingInstallments(true)
            try {
                const response = await fetch('/api/asaas/simulate-installments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: 'ambtus-flash',
                        uf: state.estado || 'SP'
                    })
                })
                const data = await response.json()
                if (data.installments) {
                    setInstallmentOptions(data.installments)
                    // Set default to 1x if not set
                    if (state.parcelas === 1) {
                        updateData('parcelas', 1)
                    }
                }
            } catch (error) {
                console.error('Error fetching installments:', error)
            } finally {
                setIsLoadingInstallments(false)
            }
        }

        fetchInstallments()
    }, [state.estado, setInstallmentOptions, updateData]) // Added updateData to deps to satisfy linter if strictly needed, though unstable in some contexts, usually context functions are stable.

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
                setError('O código PIX expirou. Por favor, gere um novo.')
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
                // Throw enhanced Asaas error from backend
                const error = new Error(data.error || 'Erro ao gerar PIX')
                    ; (error as any).code = data.code
                throw error
            }

            // Set payment result in context (no QR code needed)
            setPaymentResult({
                paymentId: data.payment.id,
                pixQrCode: '', // Not used for mobile
                pixPayload: data.payment.pixQrCode?.payload || '',
                pixExpiresAt: data.payment.pixQrCode?.expirationDate || '',
            })

            console.log('[Payment] PIX generated:', data.payment.id)

            showToast('Código PIX gerado com sucesso!', 'success')
            nextStep()

        } catch (err: any) {
            console.error('Error generating PIX:', err)
            const message = err.message || 'Erro ao comunicar com o gateway de pagamento'
            // Show toast instead of setting inline error
            showToast(message, 'error', 6000)
            // DO NOT RESET FORM
        } finally {
            setIsGeneratingPix(false)
        }
    }

    return {
        isLoadingInstallments,
        isGeneratingPix,
        error,
        isPolling,
        handleGeneratePix
    }
}
