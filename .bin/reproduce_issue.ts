import { calculateReverseTotal } from './src/lib/financial'

const targetNet = 749900 // R$ 7.499,00
const installments = 21

console.log("--- Current Logic Simulation ---")
try {
    const total = calculateReverseTotal(targetNet, installments)
    console.log(`Net: ${targetNet / 100}`)
    console.log(`Installments: ${installments}`)
    console.log(`Total Calculated: ${total / 100}`)
} catch (e) {
    console.log("Error:", e.message)
}

// Emulate Correct Logic
function calculateCorrect(targetNetCents: number, installments: number) {
    const targetNet = targetNetCents / 100
    const fixedFee = 0.49

    // Fee
    let feePct = 0
    if (installments === 1) feePct = 2.99
    else if (installments <= 6) feePct = 3.49
    else if (installments <= 12) feePct = 3.99
    else feePct = 4.29

    const intermediationRate = feePct / 100

    // Anticipation
    const monthlyRate = (installments === 1 ? 1.15 : 1.6) / 100
    // Formula: Rate * (N+1)/2
    const anticipationRate = monthlyRate * (installments + 1) / 2

    const totalRate = intermediationRate + anticipationRate
    const totalToCharge = (targetNet + fixedFee) / (1 - totalRate)

    return totalToCharge
}

console.log("\n--- Proposed Logic Simulation ---")
const correctTotal = calculateCorrect(targetNet, installments)
console.log(`Total Corrected: ${correctTotal}`)
console.log(`Difference: ${calculateReverseTotal(targetNet, installments) / 100 - correctTotal}`)
