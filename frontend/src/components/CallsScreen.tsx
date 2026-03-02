import React from 'react';
import { Phone } from 'lucide-react';

export function CallsScreen() {
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
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-xeta-elevated flex items-center justify-center mb-5">
                    <Phone className="w-9 h-9 text-xeta-green" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Call History</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Voice and video calls are coming soon to Xeta. Stay tuned!
                </p>
            </div>
        </div>
    );
}
