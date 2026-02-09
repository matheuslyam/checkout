import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'
import { calculateShipping } from '@/lib/shipping'
import { getInstallmentOptions } from '@/lib/financial'

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
        const shippingBrl = calculateShipping(uf)
        const shippingCents = Math.round(shippingBrl * 100)

        // Base total (Product + Shipping)
        const baseTotalCents = product.price + shippingCents // Both in cents

        // Generate installment options with reverse calculation via shared lib
        const installments = getInstallmentOptions(product.price, shippingCents)

        return NextResponse.json({
            productId,
            productPrice: product.price,
            shipping: shippingBrl,
            baseTotal: baseTotalCents,
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
