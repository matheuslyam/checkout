import { create } from 'zustand';
import { PERSONALITY, BitstrumState } from '../data/personality';

interface BitstrumBrain {
    currentState: BitstrumState;
    mood: number; // 0-100
    isSleeping: boolean;
    lastInteraction: number;
    shyModeAttempts: number;
    surrendered: boolean;

    // Actions
    setState: (state: BitstrumState) => void;
    registerInteraction: () => void;
    triggerShyMode: () => void;
    resetShyMode: () => void;
    checkSleepyState: () => void;
    getSpeech: () => string;
}

export const useBitstrumBrain = create<BitstrumBrain>((set, get) => ({
    currentState: 'IDLE',
    mood: 50,
    isSleeping: false,
    lastInteraction: Date.now(),
    shyModeAttempts: 0,
    surrendered: false,

    setState: (state) => set({ currentState: state }),

    registerInteraction: () => {
        const { currentState, surrendered } = get();
        set({ lastInteraction: Date.now() });

        if (currentState === 'SLEEPY') return;

        // Transitions from IDLE to PLAYFUL on interaction
        if (currentState === 'IDLE') {
            set({ currentState: 'PLAYFUL' });
        }

        // If Shy and not surrendered, interaction might trigger "Hey!"
        if (currentState === 'SHY' && !surrendered) {
            // maybe push away? Handled in component
        }
    },

    triggerShyMode: () => {
        const { shyModeAttempts, surrendered } = get();
        if (surrendered) return;

        const newAttempts = shyModeAttempts + 1;

        if (newAttempts >= 3) {
            set({
                currentState: 'IDLE', // Or special 'SURRENDER' state locally handled
                surrendered: true,
                shyModeAttempts: 0
            });
        } else {
            set({
                currentState: 'SHY',
                shyModeAttempts: newAttempts
            });
        }
    },

    resetShyMode: () => set({ shyModeAttempts: 0, surrendered: false }),

    checkSleepyState: () => {
        const hour = new Date().getHours();
        const isLate = hour >= 23 || hour < 6;

        if (isLate && !get().isSleeping) {
            set({ currentState: 'SLEEPY', isSleeping: true });
        } else if (!isLate && get().isSleeping) {
            set({ currentState: 'IDLE', isSleeping: false });
        }
    },

    getSpeech: () => {
        const { currentState, surrendered } = get();

        if (surrendered) {
            const index = Math.floor(Math.random() * PERSONALITY.SURRENDER.length);
            return PERSONALITY.SURRENDER[index];
        }

        const lines = PERSONALITY[currentState];
        const index = Math.floor(Math.random() * lines.length);
        return lines[index];
    }
}));
