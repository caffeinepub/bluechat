import React from 'react';
import { formatPresenceStatus, isOnline } from '../utils/formatters';

interface PresenceIndicatorProps {
    lastSeen: bigint | number;
    showDot?: boolean;
    className?: string;
}

export function PresenceIndicator({ lastSeen, showDot = true, className = '' }: PresenceIndicatorProps) {
    const online = isOnline(lastSeen);
    const statusText = formatPresenceStatus(lastSeen);

    return (
        <span className={`flex items-center gap-1 ${className}`}>
            {showDot && (
                <span
                    className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                        online ? 'bg-xeta-green pulse-online' : 'bg-muted-foreground/50'
                    }`}
                />
            )}
            <span className={`text-xs ${online ? 'text-xeta-green' : 'text-muted-foreground'}`}>
                {statusText}
            </span>
        </span>
    );
}
