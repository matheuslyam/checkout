# Plan: Fix Checkout Tax Calculations

## Goal Description
Correct the "reverse total" calculation logic in the checkout flow. Currently, the anticipation fee is calculated as a flat rate multiplied by the number of installments (e.g., 1.6% * 21 = 33.6%), which results in exorbitant fees (distorting a R$ 7.5k bike to ~R$ 12k). The correct logic should apply the monthly rate over the average term or use a standard coefficient formula.

## User Review Required
> [!IMPORTANT]
> **Math Change**: We are changing the anticipation cost formula from `Rate * N` to `Rate * (N+1)/2` (Linear Approximation of Average Term).
> - **Old Logic (21x)**: ~33.6% cost
> - **New Logic (21x)**: ~17.6% cost
> This will significantly lower the final price presented to the user, aligning it with the Asaas simulation.

## Proposed Changes

### Libs
#### [MODIFY] [financial.ts](file:///d:/coding/projects/checkout/src/lib/financial.ts)
- Update `calculateReverseTotal`:
  - **1x Installment**: Change anticipation rate from `1.6%` (implied) to `1.15%` (explicit).
  - **2x-21x Installments**: Change anticipation formula.
    - FROM: `anticipationRate = (1.6 / 100) * installments`
    - TO: `anticipationRate = (1.6 / 100) * (installments + 1) / 2`
  - Ensure `FIXED_FEE` remains `0.49`.

#### [NEW] [financial.test.ts](file:///d:/coding/projects/checkout/src/lib/financial.test.ts)
- Add unit tests to verify:
  - 1x calculation (should use 1.15%).
  - 10x calculation (sanity check).
  - 21x calculation (should be ~9.6k for 7.5k net, not 12k).

## Verification Plan

### Automated Tests
- Run the new unit test:
  ```bash
  bun test src/lib/financial.test.ts
  ```
  *(Note: If `bun test` is not configured, we will run it via a temporary script or `ts-node`)*.

### Manual Verification
- **Scenario 1**: 1x Credit Card
  - Input: R$ 7.499,00
  - Expected: ~R$ 7.8k (approx)
- **Scenario 2**: 21x Credit Card
  - Input: R$ 7.499,00
  - Expected: ~R$ 9.6k (approx)
- **Visual Check**:
  - Start the app `bun dev`
  - Go to Checkout
  - Select "Ambtus Flash"
  - Choose 21x
  - Verify "Total" and "Parcela" values match expectations.
