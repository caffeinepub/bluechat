import React from 'react';
import type { BluetoothMessage } from '../hooks/useBluetooth';

interface MessageBubbleProps {
    message: BluetoothMessage;
    deviceName?: string | null;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, deviceName }: MessageBubbleProps) {
    const isSent = message.sender === 'local';

    return (
        <div
            className={`flex flex-col gap-1 animate-fade-in-up ${
                isSent ? 'items-end' : 'items-start'
            }`}
        >
            {/* Sender label */}
            <span className="text-xs text-muted-foreground font-mono px-1">
                {isSent ? 'You' : (deviceName || 'Remote Device')}
            </span>

            {/* Bubble */}
            <div
                className={`relative max-w-[75%] px-4 py-2.5 rounded-bubble text-sm leading-relaxed break-words ${
                    isSent
                        ? 'bg-sent-bubble text-foreground rounded-br-bubble-sm shadow-cyan-glow-sm'
                        : 'bg-received-bubble text-foreground rounded-bl-bubble-sm border border-navy-border'
                }`}
            >
                {message.content}

                {/* Tail indicator */}
                {isSent && (
                    <div className="absolute -bottom-0 -right-0 w-0 h-0" />
                )}
            </div>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground font-mono px-1 opacity-60">
                {formatTime(message.timestamp)}
            </span>
        </div>
    );
}
