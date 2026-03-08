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

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

        // 1. CHECA PRIMEIRO O BANCO DE DADOS LOCAL (HYBRID MOCK SIMULATOR)
        const { getLogByPixId } = await import('@/lib/hybridLogger')
        const localLog = await getLogByPixId(id)

        console.log(`[DB TRACE] getLogByPixId for [${id}] returned:`, localLog ? `Status: ${localLog.pixStatus} | hybridId: ${localLog.hybridId}` : 'NULL')

        if (localLog) {
            console.log(`[Polling] Local DB Match Found for ${id}: ${localLog.pixStatus}`)

            // Se o nosso script simulador ja alterou para RECEIVED/CONFIRMED
            if (SUCCESS_STATUSES.includes(localLog.pixStatus)) {
                return NextResponse.json({
                    paymentId: id,
                    status: 'CONFIRMED',
                    rawStatus: localLog.pixStatus,
                    value: localLog.pixValue,
                    billingType: 'PIX',
                })
            }

            // Se ainda é PENDING no DB local e é um Mock de Teste, mantém PENDENTE para esperar o Simulador
            if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' && id.startsWith('pay_pix_hyb_')) {
                return NextResponse.json({
                    paymentId: id,
                    status: 'PENDING',
                    rawStatus: 'PENDING',
                    value: localLog.pixValue,
                    billingType: 'PIX',
                })
            }
        }

        // 2. MOCK PAYMENT STATUS (Bypass para PIX Padrão Simples, caso não seja Híbrido)
        if (process.env.NEXT_PUBLIC_ENABLE_TEST_CARD === 'true' && !localLog && (id.startsWith('pay_') || id.startsWith('pay_pix_'))) {
            // Simulate a short delay or return CONFIRMED immediately
            console.log(`[Polling] Mock Default Payment ${id} status: CONFIRMED`)
            return NextResponse.json({
                paymentId: id,
                status: 'CONFIRMED',
                rawStatus: 'RECEIVED',
                value: 0,
                billingType: id.startsWith('pay_pix_') ? 'PIX' : 'CREDIT_CARD',
            })
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
