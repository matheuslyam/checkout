"use client"

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
    const [isGeneratingHybridPix, setIsGeneratingHybridPix] = useState(false)
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

                if (pollingRef.current) clearInterval(pollingRef.current)
                if (timeoutRef.current) clearTimeout(timeoutRef.current)
                setIsPolling(false)

                // Navigate to success screen if it's not hybrid PIX part
                if (!state.hybridId) {
                    nextStep()
                } else {
                    // It's Hybrid PIX paying! Update local state to allow Card step
                    updateData('hybridPixStatus', 'PIX_PAID_AWAITING_CARD')
                    updateData('metodoPagamento', 'hybrid')
                }
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
                // If it's pure CARTAO or HYBRID we fetch the pure installments for now.
                // The actual hybrid installments are calculated locally via getHybridInstallmentOptions in step-3.
                // So we can leave this as is for standard CREDIT_CARD.
                const response = await fetch('/api/asaas/simulate-installments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: state.productId || 'ambtus-flash',
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
    }, [state.estado, state.productId, setInstallmentOptions])

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
            if (!state.productId) {
                throw new Error('Produto não identificado. Por favor, retorne e selecione um produto.')
            }

            const payload = {
                productId: state.productId,
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
                const error = new Error(data.message || data.error || 'Erro ao gerar PIX')
                    ; (error as any).code = data.code
                throw error
            }

            // Set payment result in context (no QR code needed)
            setPaymentResult({
                paymentId: data.payment.id,
                pixQrCode: data.payment.pixQrCode?.encodedImage || '', // Base64 image from Asaas
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

    // Generate HYBRID PIX Entry
    const handleGenerateHybridPix = async (pixEntryValue: number) => {
        setIsGeneratingHybridPix(true)
        setError(null)

        try {
            if (!state.productId) {
                throw new Error('Produto não identificado. Por favor, retorne e selecione um produto.')
            }

            const payload = {
                productId: state.productId,
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
                paymentMethod: 'HYBRID',
                pixEntry: pixEntryValue,
            }

            const response = await fetch('/api/asaas/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                const error = new Error(data.message || data.error || 'Erro ao gerar PIX Híbrido')
                    ; (error as any).code = data.code
                throw error
            }

            // Set result, including hybridId
            setPaymentResult({
                paymentId: data.payment.id,
                pixQrCode: data.payment.pixQrCode?.encodedImage || '',
                pixPayload: data.payment.pixQrCode?.payload || '',
                pixExpiresAt: data.payment.pixQrCode?.expirationDate || '',
                hybridId: data.payment.hybridId
            })

            showToast('Entrada PIX gerada com sucesso!', 'success')

        } catch (err: any) {
            console.error('Error generating Hybrid PIX:', err)
            const message = err.message || 'Erro ao comunicar com o gateway'
            showToast(message, 'error', 6000)
        } finally {
            setIsGeneratingHybridPix(false)
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
                productId: state.productId,
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
                paymentMethod: state.hybridPixStatus ? 'HYBRID' : 'CREDIT_CARD',
                pixEntry: state.hybridPixStatus ? undefined : undefined, // Handled implicitly if we just reuse CREDIT_CARD route for the second step, OR we should pass HYBRID to indicate it's the second part?
                // Wait, if it's the second part of a HYBRID, we shouldn't create ANOTHER PIX. The current `route.ts` creates both if HYBRID.
                // Actually, the server `POST` for `CREDIT_CARD` just creates the card without PIX. 
                // So for the second step, we can literally just send 'CREDIT_CARD' along with the correct installments but WITH the `debugTotal` or a new parameter to signal it's the remaining balance.
                // To keep it simple, since `route.ts` recalculates from zero, we need to pass `paymentMethod: 'HYBRID'` and `pixEntry` again so it recalculates it, BUT tell it *not* to create the PIX again.
                // To do this smoothly without refactoring the whole backend, we can just send `paymentMethod: 'HYBRID'`, `pixEntry`, and a flag `isCardStep: true`.
                // BUT `route.ts` current `HYBRID` block ONLY creates `PIX` and logs. It does NOT create the card!
                // Let's look at `route.ts`. The `HYBRID` block creates a PIX and saves a log.
                // So for the HYBRID Cartao, we should probably submit `CREDIT_CARD` and just apply a discount, or add `HYBRID_CARD` method. 
                // Instead of editing `route.ts` deeply again, I will add `isHybridCard: true` and `hybridId`.
                isHybridCard: !!state.hybridId,
                hybridId: state.hybridId,
                // Will be fetched from DB in backend if we do it cleanly, or we can just pass it. For now, let's let backend handle it or modify `route.ts`.
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
                const msg = data.message || 'Sistema temporariamente instável. Tente em instantes.'
                showToast(msg, 'error')
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
        isGeneratingHybridPix,
        isProcessingCard,
        error,
        isPolling,
        handleGeneratePix,
        handleGenerateHybridPix,
        handleCardPayment
    }
}
