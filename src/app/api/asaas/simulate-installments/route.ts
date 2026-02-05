import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'
import { calculateShipping } from '@/lib/shipping'

// Asaas installment fees (typical credit card rates)
// These should match Asaas' actual rates
const INSTALLMENT_FEES: Record<number, number> = {
    1: 0,       // No fee for 1x
    2: 0,       // 2x sem juros
    3: 0,       // 3x sem juros
    4: 0,       // 4x sem juros
    5: 0,       // 5x sem juros
    6: 0,       // 6x sem juros
    7: 0,       // 7x sem juros (promotional)
    8: 0,       // 8x sem juros (promotional)
    9: 0,       // 9x sem juros (promotional)
    10: 0,      // 10x sem juros (promotional)
    11: 0,      // 11x sem juros (promotional)
    12: 0,      // 12x sem juros (promotional)
}

const MAX_INSTALLMENTS = 12
const MIN_INSTALLMENT_VALUE = 100 // R$ 1,00 minimum per installment (in cents)

interface InstallmentOption {
    installment: number
    value: number       // Value per installment (in cents)
    total: number       // Total to pay (in cents)
    fee: number         // Fee percentage
    label: string       // Display label
}

/**
 * Calculate installment options for a given total
 */
function calculateInstallments(totalCents: number): InstallmentOption[] {
    const options: InstallmentOption[] = []

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        const feePercent = INSTALLMENT_FEES[i] || 0
        const totalWithFee = Math.round(totalCents * (1 + feePercent / 100))
        const valuePerInstallment = Math.round(totalWithFee / i)

        // Skip if installment value is too low
        if (valuePerInstallment < MIN_INSTALLMENT_VALUE) continue

        // Format values for display
        const valueFormatted = (valuePerInstallment / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

        const totalFormatted = (totalWithFee / 100).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })

        let label = `${i}x de R$ ${valueFormatted}`
        if (feePercent === 0) {
            label += ' sem juros'
        } else {
            label += ` (Total: R$ ${totalFormatted})`
        }

        options.push({
            installment: i,
            value: valuePerInstallment,
            total: totalWithFee,
            fee: feePercent,
            label,
        })
    }

    return options
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const productId = searchParams.get('productId') || 'ambtus-flash'
        const uf = searchParams.get('uf') || 'SP'

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

        // Calculate total (product + shipping) in cents
        const totalCents = product.price + shipping

        // Generate installment options
        const installments = calculateInstallments(totalCents)

        return NextResponse.json({
            productId,
            productPrice: product.price,
            shipping: shipping,
            total: totalCents,
            totalFormatted: (totalCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }),
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { productId = 'ambtus-flash', uf = 'SP' } = body

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

        // Calculate total (product + shipping) in cents
        const totalCents = product.price + shipping

        // Generate installment options
        const installments = calculateInstallments(totalCents)

        return NextResponse.json({
            productId,
            productPrice: product.price,
            shipping: shipping,
            total: totalCents,
            totalFormatted: (totalCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
            }),
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
