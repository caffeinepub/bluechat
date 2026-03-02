import React, { useState, useEffect } from 'react';
import { Phone, Video } from 'lucide-react';
import { readCallHistory } from '../types/calls';
import type { CallHistoryEntry } from '../types/calls';
import { UserAvatar } from './UserAvatar';

function formatCallTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
}

function formatDuration(secs: number): string {
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function CallsScreen() {
    const [calls, setCalls] = useState<CallHistoryEntry[]>([]);

    useEffect(() => {
        setCalls(readCallHistory());
    }, []);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="h-12 w-12 object-contain"
                    />
                    <h1 className="text-xl font-display font-bold text-foreground leading-none">Calls</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {calls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                        <div className="w-20 h-20 rounded-full bg-xeta-elevated flex items-center justify-center">
                            <Phone className="w-9 h-9 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">No calls yet</h3>
                        <p className="text-muted-foreground text-sm">
                            Start a voice or video call from any chat conversation.
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-xeta-border">
                        {calls.map(call => (
                            <li
                                key={call.id}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-xeta-surface transition-colors"
                            >
                                <UserAvatar displayName={call.contactName} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate text-sm">
                                        {call.contactName}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        {call.callType === 'video' ? (
                                            <Video className="w-3 h-3 text-xeta-green shrink-0" />
                                        ) : (
                                            <Phone className="w-3 h-3 text-xeta-green shrink-0" />
                                        )}
                                        <span className="capitalize">{call.direction}</span>
                                        <span>·</span>
                                        <span>{formatDuration(call.duration)}</span>
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {formatCallTime(call.timestamp)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
