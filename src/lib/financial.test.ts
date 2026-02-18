import { describe, expect, test } from "bun:test";
import { calculateReverseTotal, getFeePercentage } from "./financial";

describe("Financial Calculations", () => {
    // Reference Values based on R$ 7.499,00 product
    // Net Target: 7499.00

    test("1x Installment (2.99% + 1.15%)", () => {
        // Intermediation: 2.99%
        // Anticipation: 1.15% * (1+1)/2 = 1.15%
        // Total Rate: 4.14% = 0.0414
        // Fixed: 0.49
        // Formula: (7499 + 0.49) / (1 - 0.0414)
        // 7499.49 / 0.9586 = 7823.377... -> 7823.38

        const net = 749900
        const result = calculateReverseTotal(net, 1)
        const expected = 782338 // R$ 7.823,38

        // Allow 1 cent diff due to rounding
        expect(Math.abs(result - expected)).toBeLessThanOrEqual(1)
    })

    test("21x Installment (4.29% + 1.6% avg term)", () => {
        // Intermediation: 4.29%
        // Anticipation: 1.6% * (21+1)/2 = 1.6% * 11 = 17.6%
        // Total Rate: 4.29% + 17.6% = 21.89% = 0.2189
        // Fixed: 0.49
        // Formula: (7499 + 0.49) / (1 - 0.2189)
        // 7499.49 / 0.7811 = 9601.190... -> 9601.19

        const net = 749900
        const result = calculateReverseTotal(net, 21)
        // Old Logic gave ~12k. New logic gives ~9.6k
        const expected = 960119 // R$ 9.601,19

        expect(Math.abs(result - expected)).toBeLessThanOrEqual(2)
    })

    test("12x Installment (3.99% + 1.6% avg term)", () => {
        // Intermediation: 3.99%
        // Anticipation: 1.6% * (12+1)/2 = 1.6% * 6.5 = 10.4%
        // Total Rate: 14.39% = 0.1439
        // Formula: (7499 + 0.49) / (1 - 0.1439)
        // 7499.49 / 0.8561 = 8760.063... -> 8760.06

        const net = 749900
        const result = calculateReverseTotal(net, 12)
        const expected = 876006

        expect(Math.abs(result - expected)).toBeLessThanOrEqual(2)
    })
})
