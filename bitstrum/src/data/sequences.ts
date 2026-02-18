// src/data/sequences.ts

export type SequenceId = 'falling-down' | 'creep';

export interface HarmonicSequence {
    id: SequenceId;
    notes: number[]; // Array of string indices (0-5)
    label: string;
}

// 0 = High E (E4)
// 1 = B (B3)
// 2 = G (G3)
// 3 = D (D3)
// 4 = A (A2)
// 5 = Low E (E2)

export const HARMONIC_SEQUENCES: HarmonicSequence[] = [
    {
        id: 'falling-down',
        // Example: High to low cascade
        notes: [0, 1, 2, 3],
        label: 'Falling Down'
    },
    {
        id: 'creep',
        // Example: Low Bass movement
        notes: [5, 4, 3, 2],
        label: 'Creep'
    }
];
