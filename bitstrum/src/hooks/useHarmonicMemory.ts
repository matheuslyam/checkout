import { useState, useRef, useCallback } from 'react';
import { HARMONIC_SEQUENCES, type SequenceId } from '../data/sequences';

const MAX_BUFFER_SIZE = 10;

export function useHarmonicMemory() {
    const noteBuffer = useRef<number[]>([]);
    const [detectedSequence, setDetectedSequence] = useState<SequenceId | null>(null);

    const recordNote = useCallback((stringIndex: number) => {
        // Add note to buffer
        noteBuffer.current = [...noteBuffer.current, stringIndex].slice(-MAX_BUFFER_SIZE);

        const buffer = noteBuffer.current;
        let matchFound: SequenceId | null = null;

        // Check against all defined sequences
        for (const seq of HARMONIC_SEQUENCES) {
            if (buffer.length >= seq.notes.length) {
                // Get the end of the buffer matching the sequence length
                const suffix = buffer.slice(-seq.notes.length);

                // Compare arrays
                const isMatch = suffix.every((val, index) => val === seq.notes[index]);

                if (isMatch) {
                    matchFound = seq.id;
                    break;
                }
            }
        }

        if (matchFound) {
            setDetectedSequence(matchFound);
            // Clear buffer to prevent double triggers? Or keep it?
            // Clearing it feels safer to avoid "echo" triggers if they strum one more note that happens to start another sequence?
            // For now, let's clear it to signify "Event Consumed"
            noteBuffer.current = [];

            // Auto-reset detected sequence after duration (visual glow time)
            setTimeout(() => {
                setDetectedSequence(null);
            }, 3000);
        }

    }, []);

    return { recordNote, detectedSequence };
}
