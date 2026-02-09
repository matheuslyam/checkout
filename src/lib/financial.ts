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

    // Anticipation: 1.6% per installment (Linear approx for full anticipation)
    // For 1x, we usually presume 1 month anticipation (30 days -> 2 days)
    const anticipationRate = (1.6 / 100) * installments

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
export function getInstallmentOptions(productPriceCents: number, shippingCents: number) {
    const targetNet = productPriceCents + shippingCents
    const options = []

    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        const totalCents = calculateReverseTotal(targetNet, i)
        const installmentValueCents = Math.round(totalCents / i)

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
