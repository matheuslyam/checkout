import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'
import { calculateShipping } from '@/lib/shipping'

// ==========================================
// CONFIGURATION
// ==========================================
const MAX_INSTALLMENTS = 21

// Fixed fee per transaction (added to base value before applying percentage)
const FIXED_FEE = 0.49

const MIN_INSTALLMENT_VALUE = 500 // R$ 5,00 minimum per installment

interface InstallmentOption {
    installment: number
    value: number       // Value per installment (in cents)
    total: number       // Total to pay (in cents)
    fee: number         // Fee percentage applied
    label: string       // Display label
}

/**
 * Get fee percentage based on number of installments
 * Based on Asaas "Cobranças online" table
 */
function getFeePercentage(installments: number): number {
    if (installments === 1) return 2.99
    if (installments >= 2 && installments <= 6) return 3.49
    if (installments >= 7 && installments <= 12) return 3.99
    if (installments >= 13 && installments <= 21) return 4.29
    return 0
}

/**
 * Calculate installment options using Reverse Calculation (Net Amount Preservation)
 * Formula: TotalToCharge = (BaseValue + FixedFee) / (1 - FeePercentage)
 */
function calculateInstallments(baseValueCents: number): InstallmentOption[] {
    const options: InstallmentOption[] = []

    // Convert base value to BRL (float) for calculation
    const baseValue = baseValueCents / 100

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        const feePercent = getFeePercentage(i)
        const feeDecimal = feePercent / 100

        // Reverse calculation to ensure merchant receives the full base value
        // We add the fixed fee (0.49) to the base, then divide by (1 - rate)
        const totalToCharge = (baseValue + FIXED_FEE) / (1 - feeDecimal)

        // Convert back to cents and round
        const totalWithFeeCents = Math.round(totalToCharge * 100)

        // Calculate per-installment value
        const valuePerInstallmentCents = Math.round(totalWithFeeCents / i)

        // Skip if installment value is too low
        if (valuePerInstallmentCents < MIN_INSTALLMENT_VALUE) continue

        // Format values for display
        const valueFormatted = (valuePerInstallmentCents / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

        const totalFormatted = (totalWithFeeCents / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

        // Label formulation
        // For 1x, we usually show "à vista" or similar, but keeping consistent format is fine
        // Since we are passing interest to customer, we always show total
        const label = `${i}x de R$ ${valueFormatted} (Total: R$ ${totalFormatted})`

        options.push({
            installment: i,
            value: valuePerInstallmentCents,
            total: totalWithFeeCents,
            fee: feePercent,
            label,
        })
    }

    return options
}

export async function GET(request: NextRequest) {
    return handleRequest(request)
}

export async function POST(request: NextRequest) {
    return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
    try {
        let productId = 'ambtus-flash'
        let uf = 'SP'

        if (request.method === 'GET') {
            const searchParams = request.nextUrl.searchParams
            productId = searchParams.get('productId') || productId
            uf = searchParams.get('uf') || uf
        } else {
            const body = await request.json()
            productId = body.productId || productId
            uf = body.uf || uf
        }

        // Get product price from server catalog
        const product = getProductById(productId)
        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        // Calculate shipping
        const shipping = calculateShipping(uf)

        // Base total (Product + Shipping) - This is what the merchant wants to receive NET
        const baseTotalCents = product.price + shipping

        // Generate installment options with reverse calculation
        const installments = calculateInstallments(baseTotalCents)

        return NextResponse.json({
            productId,
            productPrice: product.price,
            shipping: shipping,
            baseTotal: baseTotalCents, // This is the net amount
            installments,
        })

    } catch (error) {
        console.error('[Installments] Error calculating:', error)
        return NextResponse.json(
            { error: 'Failed to calculate installments' },
            { status: 500 }
        )
    }
}
