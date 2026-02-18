import { getFeePercentage } from './src/lib/financial'

const targetNet = 749900 // R$ 7.499,00
const fixedFee = 0.49

function calculateMdrOnly(netCents: number, installments: number) {
    const net = netCents / 100
    const feePct = getFeePercentage(installments)
    const mdrRate = feePct / 100

    // Formula: (Net + Fixed) / (1 - MDR)
    const total = (net + fixedFee) / (1 - mdrRate)
    return total
}

console.log("--- Asaas Simulation Hypothesis (MDR Only) ---")
const sim1x = calculateMdrOnly(targetNet, 1)
console.log(`1x: R$ ${sim1x.toFixed(2)} (Target: 7730.63)`)

const sim21x = calculateMdrOnly(targetNet, 21)
console.log(`21x: R$ ${sim21x.toFixed(2)} (Target: 7836.42)`)
