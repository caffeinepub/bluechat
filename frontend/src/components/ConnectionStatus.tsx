import React from 'react';
import { Bluetooth, BluetoothOff, BluetoothSearching, Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { BluetoothState } from '../hooks/useBluetooth';

interface ConnectionStatusProps {
    state: BluetoothState;
    deviceName: string | null;
    onDisconnect: () => void;
    onScan: () => void;
}

const stateConfig: Record<BluetoothState, { label: string; color: string; icon: React.ReactNode }> = {
    idle: {
        label: 'Not Connected',
        color: 'text-muted-foreground',
        icon: <BluetoothOff className="w-4 h-4" />,
    },
    scanning: {
        label: 'Scanning...',
        color: 'text-cyan-glow',
        icon: <BluetoothSearching className="w-4 h-4 animate-pulse" />,
    },
    connecting: {
        label: 'Connecting...',
        color: 'text-cyan-glow',
        icon: <BluetoothSearching className="w-4 h-4 animate-pulse" />,
    },
    connected: {
        label: 'Connected',
        color: 'text-cyan-glow',
        icon: <Bluetooth className="w-4 h-4" />,
    },
    disconnected: {
        label: 'Disconnected',
        color: 'text-destructive',
        icon: <BluetoothOff className="w-4 h-4" />,
    },
    error: {
        label: 'Error',
        color: 'text-destructive',
        icon: <BluetoothOff className="w-4 h-4" />,
    },
    unsupported: {
        label: 'Unsupported',
        color: 'text-destructive',
        icon: <WifiOff className="w-4 h-4" />,
    },
};

export function ConnectionStatus({ state, deviceName, onDisconnect, onScan }: ConnectionStatusProps) {
    const config = stateConfig[state];
    const isConnected = state === 'connected';
    const isScanning = state === 'scanning' || state === 'connecting';

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-navy-surface border-b border-navy-border">
            {/* Status indicator dot */}
            <div className="flex items-center gap-2">
                <div className={`relative flex items-center justify-center`}>
                    {isConnected && (
                        <span className="absolute inline-flex w-3 h-3 rounded-full bg-cyan-glow opacity-75 pulse-dot" />
                    )}
                    <span
                        className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
                            isConnected
                                ? 'bg-cyan-glow'
                                : isScanning
                                ? 'bg-cyan-dim animate-pulse'
                                : state === 'error' || state === 'disconnected'
                                ? 'bg-destructive'
                                : 'bg-navy-border'
                        }`}
                    />
                </div>

                <span className={`flex items-center gap-1.5 text-sm font-medium font-mono ${config.color}`}>
                    {config.icon}
                    {isConnected && deviceName ? (
                        <span>
                            Connected to{' '}
                            <span className="text-cyan-glow text-glow-cyan font-semibold">{deviceName}</span>
                        </span>
                    ) : (
                        <span>{config.label}</span>
                    )}
                </span>
            </div>

            <div className="flex-1" />

            {/* Action buttons */}
            {isConnected ? (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
                >
                    <X className="w-3 h-3" />
                    Disconnect
                </Button>
            ) : (
                !isScanning && state !== 'unsupported' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onScan}
                        className="h-7 px-2 text-xs text-cyan-glow hover:text-cyan-bright hover:bg-cyan-muted/20 gap-1"
                    >
                        <Bluetooth className="w-3 h-3" />
                        Connect
                    </Button>
                )
            )}
        </div>
    );
}
