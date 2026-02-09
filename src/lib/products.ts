// ============================================
// Product Catalog - Server-side Source of Truth
// ============================================
// IMPORTANT: Never trust client-side prices!
// All pricing must come from this catalog.

import { BIKES_CATALOG, Product } from './catalog'

export { type Product }

/**
 * Product catalog - the only source of truth for pricing.
 * To add a new product, add it here with its server-controlled price.
 */
export const PRODUCTS = BIKES_CATALOG

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
