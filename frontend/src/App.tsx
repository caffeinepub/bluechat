import React, { useState, useCallback, useMemo } from 'react';
import { Bluetooth } from 'lucide-react';
import { useBluetooth } from './hooks/useBluetooth';
import { ConnectionStatus } from './components/ConnectionStatus';
import { BluetoothPairing } from './components/BluetoothPairing';
import { ChatInterface } from './components/ChatInterface';
import { Toaster } from '@/components/ui/sonner';

// Generate a stable conversation ID for this session
function generateConversationId(): string {
    const stored = sessionStorage.getItem('bt-conversation-id');
    if (stored) return stored;
    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('bt-conversation-id', id);
    return id;
}

const CONVERSATION_ID = generateConversationId();

export default function App() {
    const {
        state,
        device,
        deviceName,
        messages,
        error,
        isSupported,
        scan,
        disconnect,
        sendMessage,
        clearMessages,
    } = useBluetooth();

    const isConnected = state === 'connected';

    const handleScan = useCallback(async () => {
        await scan();
    }, [scan]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 bg-navy-mid border-b border-navy-border flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30 flex items-center justify-center">
                        <Bluetooth className="w-4 h-4 text-cyan-glow" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
                            Xeta<span className="text-cyan-glow text-glow-cyan">Chat</span>
                        </h1>
                        <p className="text-xs text-muted-foreground font-mono leading-none mt-0.5">
                            Bluetooth Messenger
                        </p>
                    </div>
                </div>

                {/* Signal bars decoration */}
                <div className="flex items-end gap-0.5 h-5">
                    {[2, 3, 4, 5, 6].map((h, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-sm ${
                                isConnected ? 'bg-cyan-glow' : 'bg-navy-border'
                            } transition-colors duration-500`}
                            style={{
                                height: `${h * 3}px`,
                                ...(isConnected ? { animation: `bt-fade 1.5s ease-in-out infinite ${i * 0.2}s` } : {}),
                            }}
                        />
                    ))}
                </div>
            </header>

            {/* Connection status bar */}
            <ConnectionStatus
                state={state}
                deviceName={deviceName}
                onDisconnect={handleDisconnect}
                onScan={handleScan}
            />

            {/* Main content */}
            <main className="flex flex-col flex-1 min-h-0">
                {isConnected ? (
                    <ChatInterface
                        deviceName={deviceName}
                        messages={messages}
                        conversationId={CONVERSATION_ID}
                        onSendMessage={sendMessage}
                        onClearMessages={clearMessages}
                    />
                ) : (
                    <BluetoothPairing
                        state={state}
                        error={error}
                        isSupported={isSupported}
                        onScan={handleScan}
                    />
                )}
            </main>

            <Toaster
                theme="dark"
                toastOptions={{
                    style: {
                        background: 'oklch(0.22 0.025 240)',
                        border: '1px solid oklch(0.32 0.04 240)',
                        color: 'oklch(0.95 0.01 240)',
                    },
                }}
            />
        </div>
    );
}
