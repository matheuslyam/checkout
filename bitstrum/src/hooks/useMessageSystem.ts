import { useState, useCallback, useRef } from 'react';
import { BITSTRUM_MESSAGES } from '../data/messages';
import type { BitstrumMessage } from '../types';

const MESSAGE_THRESHOLD = 3; // Number of strums before a message *might* appear
const MESSAGE_COOLDOWN_MS = 10000; // Minimum time between messages

export function useMessageSystem() {
    const [currentMessage, setCurrentMessage] = useState<BitstrumMessage | null>(null);
    const strumCount = useRef(0);
    const lastMessageTime = useRef(0);
    const shownMessageIds = useRef<Set<string>>(new Set());

    const triggerMessage = useCallback((forceId?: string) => {
        const now = Date.now();

        // Forced message (Easter Egg)
        if (forceId) {
            const msg = BITSTRUM_MESSAGES.find(m => m.id === forceId);
            if (msg) {
                setCurrentMessage(msg);
                lastMessageTime.current = now;
                strumCount.current = 0;
                // Auto-dismiss after 6s
                setTimeout(() => setCurrentMessage(null), 6000);
            }
            return;
        }

        // Checking Constraints
        if (now - lastMessageTime.current < MESSAGE_COOLDOWN_MS) return;

        strumCount.current += 1;
        if (strumCount.current < MESSAGE_THRESHOLD) return;

        // Reset counter & updated chance logic (e.g., 40% chance after threshold)
        if (Math.random() > 0.4) {
            strumCount.current = 0; // Reset count but don't show message yet
            return;
        }

        // Filter available messages (exclude special unlock conditions & recently shown)
        // We reset the shown set if we've seen almost all messages
        const standardMessages = BITSTRUM_MESSAGES.filter(m => !m.unlockCondition);

        if (shownMessageIds.current.size >= standardMessages.length - 2) {
            shownMessageIds.current.clear();
        }

        const available = standardMessages.filter(m => !shownMessageIds.current.has(m.id));

        if (available.length === 0) return;

        // Shuffle / Random Pick
        const picked = available[Math.floor(Math.random() * available.length)];

        // Show Message
        setCurrentMessage(picked);
        shownMessageIds.current.add(picked.id);
        lastMessageTime.current = now;
        strumCount.current = 0;

        // Auto-dismiss
        setTimeout(() => setCurrentMessage(null), 5000);

    }, []);

    return { currentMessage, triggerMessage };
}
