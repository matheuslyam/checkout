// ============================================
// Product Catalog - Server-side Source of Truth
// ============================================
// IMPORTANT: Never trust client-side prices!
// All pricing must come from this catalog.

export interface Product {
    id: string
    name: string
    price: number // in BRL (e.g., 12490 = R$ 12.490,00)
    description?: string
    maxInstallments: number
}

/**
 * Product catalog - the only source of truth for pricing.
 * To add a new product, add it here with its server-controlled price.
 */
export const PRODUCTS: Record<string, Product> = {
    'ambtus-flash': {
        id: 'ambtus-flash',
        name: 'AMBTUS FLASH',
        price: 12490,
        description: 'Edição Limitada',
        maxInstallments: 12,
    },
}

/**
 * Get product by ID
 * @param id Product ID
 * @returns Product or null if not found
 */
export function getProductById(id: string): Product | null {
    return PRODUCTS[id] || null
}

/**
 * Get all products
 * @returns Array of all products
 */
export function getAllProducts(): Product[] {
    return Object.values(PRODUCTS)
}

/**
 * Calculate installment value for a product
 * @param productId Product ID
 * @param installments Number of installments
 * @returns Installment value or null if invalid
 */
export function calculateInstallmentValue(
    productId: string,
    installments: number
): number | null {
    const product = getProductById(productId)
    if (!product) return null
    if (installments < 1 || installments > product.maxInstallments) return null

    return product.price / installments
}
