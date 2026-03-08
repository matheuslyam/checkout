import { useEffect, useRef } from 'react'

export function useHybridRecovery(
    hybridId: string | null, // From CheckoutContext
    pixStatus: string | null, // The status of the PIX portion
    cardStatus: string | null, // The status of the Card portion
    productUrl: string // e.g. window.location.href to send in the email
) {
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const RESCUE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

    useEffect(() => {
        // If we have a hybrid session, PIX is paid, and CARD is NOT paid...
        if (hybridId && (pixStatus === 'RECEIVED' || pixStatus === 'CONFIRMED') && !cardStatus) {

            // Start the 5-minute countdown for Email Rescue
            console.log(`[useHybridRecovery] Timer started for hybridId: ${hybridId}. Rescue email in 5 minutes if abandoned.`)

            timerRef.current = setTimeout(() => {
                console.log(`[useHybridRecovery] 5 minutes elapsed. Triggering Rescue Email API for ${hybridId}...`)

                fetch('/api/asaas/trigger-rescue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hybridId, productUrl })
                }).catch(err => {
                    console.error('[useHybridRecovery] Failed to trigger rescue', err)
                })

            }, RESCUE_TIMEOUT_MS)

        } else {
            // If they paid the card or PIX is not paid yet, clear the timer
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
                console.log(`[useHybridRecovery] Timer cleared.`)
            }
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [hybridId, pixStatus, cardStatus, productUrl])
}
