import { NextRequest, NextResponse } from 'next/server'
import { getAsaasService } from '@/services/asaas'

// ============================================
// Payment Status Constants
// ============================================

const SUCCESS_STATUSES = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH']
const PENDING_STATUSES = ['PENDING', 'AWAITING_RISK_ANALYSIS']
const FAILED_STATUSES = ['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'OVERDUE', 'DELETED']

// ============================================
// GET Handler - Check Payment Status
// ============================================

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id || id.length < 10) {
            return NextResponse.json(
                { error: 'ID de pagamento inválido' },
                { status: 400 }
            )
        }

        const asaas = getAsaasService()
        const payment = await asaas.getPaymentStatus(id)

        // Determine simplified status for front-end
        let simplifiedStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'UNKNOWN'

        if (SUCCESS_STATUSES.includes(payment.status)) {
            simplifiedStatus = 'CONFIRMED'
        } else if (PENDING_STATUSES.includes(payment.status)) {
            simplifiedStatus = 'PENDING'
        } else if (FAILED_STATUSES.includes(payment.status)) {
            simplifiedStatus = 'FAILED'
        } else {
            simplifiedStatus = 'UNKNOWN'
        }

        console.log(`[Polling] Payment ${id} status: ${payment.status} → ${simplifiedStatus}`)

        return NextResponse.json({
            paymentId: payment.id,
            status: simplifiedStatus,
            rawStatus: payment.status,
            value: payment.value,
            billingType: payment.billingType,
            // Don't expose sensitive data in polling response
        })

    } catch (error) {
        console.error('[Check Payment] Error:', error)

        // Check if it's a 404 from Asaas
        const message = error instanceof Error ? error.message : 'Unknown error'
        const isNotFound = message.includes('404') || message.includes('not found')

        return NextResponse.json(
            {
                error: isNotFound ? 'Pagamento não encontrado' : 'Erro ao verificar pagamento',
                status: 'ERROR'
            },
            { status: isNotFound ? 404 : 500 }
        )
    }
}
