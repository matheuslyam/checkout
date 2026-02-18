import { useRef, useCallback, useEffect } from 'react';

// Gentle dreamy reverb impulse generator
function createReverbImpulse(audioCtx: AudioContext, durationSeconds: number = 3, decay: number = 2.5) {
    const rate = audioCtx.sampleRate;
    const length = rate * durationSeconds;
    const impulse = audioCtx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Randomized white noise with exponential decay
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }

    return impulse;
}

export function useHarmonicEngine() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const reverbNodeRef = useRef<ConvolverNode | null>(null);
    const isInitialized = useRef(false);

    // Initializer - safely capable of being called multiple times (chk flag)
    const initAudio = useCallback(() => {
        if (isInitialized.current) return;

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();

            // Master Gain (Volume)
            const masterGain = ctx.createGain();
            masterGain.gain.value = 0.35; // Slight reduction for polyphony headroom
            masterGain.connect(ctx.destination);

            // Reverb (Convolver)
            const reverb = ctx.createConvolver();
            reverb.buffer = createReverbImpulse(ctx, 3.5, 3.0); // Longer, dreamier tail

            // Wet/Dry Mix 
            const reverbGain = ctx.createGain();
            reverbGain.gain.value = 0.45; // 45% Wet
            reverb.connect(reverbGain);
            reverbGain.connect(masterGain);

            audioCtxRef.current = ctx;
            masterGainRef.current = masterGain;
            reverbNodeRef.current = reverb;
            isInitialized.current = true;
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }, []);

    // Ensure audio context is resumed on user interaction
    const checkContext = useCallback(() => {
        if (!audioCtxRef.current) initAudio();
        const ctx = audioCtxRef.current;
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(console.error);
        }
        return ctx;
    }, [initAudio]);

    const playNote = useCallback((frequency: number) => {
        const ctx = checkContext();
        if (!ctx) return;

        const t = ctx.currentTime;
        const master = masterGainRef.current!;
        const reverb = reverbNodeRef.current!;

        // ─── Dual Oscillator Architecture ───
        // Osc 1: Triangle (Fundamental, Warmth)
        const osc1 = ctx.createOscillator();
        osc1.type = 'triangle';
        osc1.frequency.value = frequency;

        // Osc 2: Sawtooth (Harmonics, Shine) - Detuned slightly for richness
        const osc2 = ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = frequency;
        osc2.detune.value = 4; // cents

        // Envelope (ADSR)
        const envelope = ctx.createGain();
        envelope.gain.setValueAtTime(0, t);
        envelope.gain.linearRampToValueAtTime(0.8, t + 0.05); // Attack: 50ms (softer pluck)
        envelope.gain.exponentialRampToValueAtTime(0.4, t + 0.3); // Decay: Initial drop level
        envelope.gain.exponentialRampToValueAtTime(0.001, t + 3.5); // Release/Tail: Long ringing

        // Sub-mix oscillators
        // Sawtooth is harsher, so we mix it lower than Triangle
        const osc1Gain = ctx.createGain();
        osc1Gain.gain.value = 0.7;

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.value = 0.2; // Add just a bit of shimmer

        // Connect Graph
        osc1.connect(osc1Gain);
        osc2.connect(osc2Gain);

        osc1Gain.connect(envelope);
        osc2Gain.connect(envelope);

        // Routing to Master (Dry) & Reverb (Wet)
        envelope.connect(master);
        envelope.connect(reverb);

        // Start/Stop
        osc1.start(t);
        osc2.start(t);

        // Stop after tail completes to free resources
        osc1.stop(t + 4.0);
        osc2.stop(t + 4.0);

    }, [checkContext]);

    // Setup cleanup
    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(console.error);
                isInitialized.current = false;
            }
        };
    }, []);

    return { playNote };
}
