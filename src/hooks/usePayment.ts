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
    const [isProcessingCard, setIsProcessingCard] = useState(false)
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
                    // Note: parcelas default is already 1 in initialState, no need to update
                }
            } catch (error) {
                console.error('Error fetching installments:', error)
            } finally {
                setIsLoadingInstallments(false)
            }
        }

        fetchInstallments()
    }, [state.estado, setInstallmentOptions])

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
            const payload = {
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
            }

            console.log("DEBUG PAYLOAD:", payload)

            const response = await fetch('/api/asaas/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

    // Process Credit Card Payment
    const handleCardPayment = async (cardData: {
        number: string
        name: string
        expiry: string
        cvv: string
        cpf: string
    }) => {
        setIsProcessingCard(true)
        setError(null)

        // Log Step Start
        console.log(`[CHECKOUT_FLOW] Step: 3 | Status: PENDING | Payload: START_CARD_TRANSACTION`)

        try {
            // Split expiry MM/YY
            const [expiryMonth, expiryYear] = cardData.expiry.split('/')

            // Clean number and phone
            const cleanPhone = state.telefone?.replace(/\D/g, '') || ''
            const cleanCpf = cardData.cpf.replace(/\D/g, '')

            const payload = {
                productId: 'ambtus-flash',
                installments: state.parcelas,
                customer: {
                    name: state.nome,
                    email: state.email,
                    cpfCnpj: cleanCpf, // Use card CPF for customer too if strictly needed, or keep state.cpf? Usually customer CPF is global. Let's use card CPF as it's the one being entered.
                    phone: cleanPhone,
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
                paymentMethod: 'CREDIT_CARD',
                creditCard: {
                    holderName: cardData.name,
                    number: cardData.number.replace(/\s/g, ''),
                    expiryMonth,
                    expiryYear: `20${expiryYear}`,
                    ccv: cardData.cvv,

                    holderEmail: state.email,
                    holderCpfCnpj: cleanCpf,
                    holderPostalCode: state.cep.replace(/\D/g, ''),
                    holderAddressNumber: state.numero,
                    holderPhone: cleanPhone
                }
            }

            const response = await fetch('/api/asaas/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            // Log Result
            console.log(`[CHECKOUT_FLOW] Step: 3 | Status: ${response.status} | Payload: ${JSON.stringify(data)}`)

            // 🔒 THE SUCCESS LOCK: Only proceed if status is explicitly 200
            if (response.status === 200 && data.success) {
                // Success
                setPaymentResult({
                    paymentId: data.payment.id,
                    pixQrCode: '',
                    pixPayload: '',
                    pixExpiresAt: '',
                })
                setPaymentStatus('CONFIRMED')

                showToast('Pagamento aprovado com sucesso!', 'success')

                // Explicit Navigation
                nextStep()
                return
            }

            // 🛡️ HANDLE ERRORS BY TYPE

            if (data.type === 'SECURITY_ERROR') {
                showToast(data.message || 'Erro de segurança.', 'error')
                return
            }

            if (data.type === 'USER_ERROR') {
                showToast(data.message || 'Verifique os dados e tente novamente.', 'error')
                return
            }

            if (data.type === 'INTERNAL_ERROR' || response.status >= 500) {
                showToast('Sistema temporariamente instável. Tente em instantes.', 'error')
                return
            }

            // Fallback for unmapped errors
            throw new Error(data.message || 'Erro inesperado')

        } catch (err: any) {
            console.error('Error processing card:', err)

            // If we caught a random JS error or network fail (not api response)
            if (!err.message?.includes('Sistema')) { // Avoid double toast if we already toasted above
                showToast('Não foi possível conectar ao servidor.', 'error')
            }
        } finally {
            setIsProcessingCard(false)
        }
    }

    return {
        isLoadingInstallments,
        isGeneratingPix,
        isProcessingCard,
        error,
        isPolling,
        handleGeneratePix,
        handleCardPayment
    }
}
