// ============================================
// Shipping Calculation - Server-side
// ============================================
// This mirrors the front-end logic but is the authoritative source.
// The front-end version is for display only; this is used for billing.

/**
 * States in the Sul/Sudeste region (lower shipping cost)
 */
const ESTADOS_SUL_SUDESTE = ['SP', 'RJ', 'MG', 'ES', 'PR', 'SC', 'RS']

/**
 * Shipping costs by region
 */
const FRETE_SUL_SUDESTE = 150    // R$ 150,00
const FRETE_OUTRAS_REGIOES = 300 // R$ 300,00

/**
 * Calculate shipping cost based on state (UF)
 * @param uf State abbreviation (e.g., 'SP', 'BA')
 * @returns Shipping cost in BRL
 */
export function calculateShipping(uf: string): number {
    if (!uf || uf.length !== 2) return 0
    const upperUf = uf.toUpperCase()
    return ESTADOS_SUL_SUDESTE.includes(upperUf)
        ? FRETE_SUL_SUDESTE
        : FRETE_OUTRAS_REGIOES
}

/**
 * Get estimated delivery time based on region
 * @param uf State abbreviation
 * @returns Delivery time string
 */
export function getEstimatedDelivery(uf: string): string {
    if (!uf || uf.length !== 2) return 'Informe o CEP'
    const upperUf = uf.toUpperCase()
    return ESTADOS_SUL_SUDESTE.includes(upperUf)
        ? '10-15 dias úteis'
        : '15-20 dias úteis'
}

/**
 * Check if state is in Sul/Sudeste region
 * @param uf State abbreviation
 * @returns true if Sul/Sudeste
 */
export function isSulSudeste(uf: string): boolean {
    if (!uf) return false
    return ESTADOS_SUL_SUDESTE.includes(uf.toUpperCase())
}
