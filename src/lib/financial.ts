export const MAX_INSTALLMENTS = 21
export const FIXED_FEE = 0.49

/**
 * Asaas "Cobranças online" Fee Table
 */
export function getFeePercentage(installments: number): number {
    if (installments === 1) return 2.99
    if (installments >= 2 && installments <= 6) return 3.49
    if (installments >= 7 && installments <= 12) return 3.99
    if (installments >= 13 && installments <= 21) return 4.29
    return 0
}

/**
 * Calculate the total transaction value needed to receive a target net amount.
 * Includes Intermediation Fee + Anticipation Fee (1.6% p.m.).
 * 
 * Formula derivation:
 * We want Net = Target
 * Total - Fees = Target
 * Fees = Fixed + (Total * IntermediationRate) + (Total * AnticipationRate)
 * 
 * Anticipation Logic: 
 * We assume a simplified linear anticipation cost of 1.6% per month on the Total.
 * EffectiveAnticipationRate = 0.016 * installments
 * 
 * Total = Target + Fixed + Total(IntermediationRate + AnticipationRate)
 * Total - Total(IntermediationRate + AnticipationRate) = Target + Fixed
 * Total * (1 - (IntermediationRate + AnticipationRate)) = Target + Fixed
 * Total = (Target + Fixed) / (1 - (IntermediationRate + AnticipationRate))
 */
export function calculateReverseTotal(targetNetCents: number, installments: number): number {
    const targetNet = targetNetCents / 100

    const intermediationRate = getFeePercentage(installments) / 100

    // Anticipation Logic
    // 1x: 1.15% p.m.
    // 2x+: 1.60% p.m.
    const monthlyAnticipationRate = installments === 1 ? 1.15 : 1.6

    // Formula: Rate * (N+1)/2  (Linear Approximation for Average Term)
    // This reduces the effective rate significantly compared to Rate * N
    const anticipationRate = (monthlyAnticipationRate / 100) * ((installments + 1) / 2)

    const totalRate = intermediationRate + anticipationRate

    // Check for rate overflow (unlikely but possible with high installments)
    if (totalRate >= 1) {
        throw new Error("Taxas excedem 100% do valor")
    }

    const totalToCharge = (targetNet + FIXED_FEE) / (1 - totalRate)

    return Math.round(totalToCharge * 100)
}

/**
 * Calculate full installment options list
 */
export function getInstallmentOptions(productPriceCents: number, shippingCents: number, isTestProduct: boolean = false) {
    const targetNet = productPriceCents + shippingCents
    const options = []

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        // If it's the test product, bypass all fees and anticipation
        const totalCents = isTestProduct ? targetNet : calculateReverseTotal(targetNet, i)
        // Ensure rounding for installment value so it's consistent
        const installmentValueCents = isTestProduct
            ? Math.round(targetNet / i) // Technically 100/i might have remainders, but Asaas handles precision natively
            : Math.round(totalCents / i)

        // Calculate the actual fee amount for display/internal use
        const feeAmountCents = totalCents - targetNet

        options.push({
            installment: i,
            value: installmentValueCents,
            total: totalCents,
            feeAmount: feeAmountCents,
            label: `${i}x de ${formatCurrency(installmentValueCents / 100)} (Total: ${formatCurrency(totalCents / 100)})`
        })
    }
    return options
}

function formatCurrency(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

/**
 * Hybrid Calculate Reverse Total (SO 43.1)
 * The fees (Intermediation + Anticipation) must ONLY apply to the remaining card balance. 
 * PIX entry reduces the principal directly.
 */
export function calculateHybridTotal(targetNetCents: number, pixEntryCents: number, installments: number): number {
    // 1. Deduct PIX entirely from the principal
    const remainingNetCents = targetNetCents - pixEntryCents

    if (remainingNetCents <= 0) return 0

    const targetNet = remainingNetCents / 100

    const intermediationRate = getFeePercentage(installments) / 100

    // Anticipation Logic (1.6% or 1.15%)
    const monthlyAnticipationRate = installments === 1 ? 1.15 : 1.6

    // Rate * (N+1)/2
    const anticipationRate = (monthlyAnticipationRate / 100) * ((installments + 1) / 2)

    const totalRate = intermediationRate + anticipationRate

    if (totalRate >= 1) {
        throw new Error("Taxas excedem 100% do saldo residual")
    }

    // Fixed fee (0.49) applies to the sub-transaction (Card)
    const cardTotalToCharge = (targetNet + FIXED_FEE) / (1 - totalRate)

    return Math.round(cardTotalToCharge * 100)
}

/**
 * Calculate full installment options list for HYBRID
 */
export function getHybridInstallmentOptions(productPriceCents: number, shippingCents: number, pixEntryCents: number, isTestProduct: boolean = false) {
    const targetNet = productPriceCents + shippingCents

    if (pixEntryCents >= targetNet) {
        return [] // Fully paid by PIX
    }

    const remainingNet = targetNet - pixEntryCents
    const options = []

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        // If it's the test product, bypass all fees
        const cardTotalCents = isTestProduct ? remainingNet : calculateHybridTotal(targetNet, pixEntryCents, i)

        const installmentValueCents = Math.round(cardTotalCents / i)
        const feeAmountCents = cardTotalCents - remainingNet

        options.push({
            installment: i,
            value: installmentValueCents,
            total: cardTotalCents,
            feeAmount: feeAmountCents,
            label: `${i}x de ${formatCurrency(installmentValueCents / 100)} (Cartão: ${formatCurrency(cardTotalCents / 100)})`
        })
    }
    return options
}
