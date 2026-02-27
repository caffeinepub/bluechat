import React from 'react';
import { Bluetooth, BluetoothSearching, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BluetoothState } from '../hooks/useBluetooth';

interface BluetoothPairingProps {
    state: BluetoothState;
    error: string | null;
    isSupported: boolean;
    onScan: () => void;
}

export function BluetoothPairing({ state, error, isSupported, onScan }: BluetoothPairingProps) {
    const isScanning = state === 'scanning' || state === 'connecting';

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                {/* Logo / Icon area */}
                <div className="relative mb-8">
                    {/* Animated scan rings */}
                    {isScanning && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-glow/30 scan-ring" />
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-glow/20 scan-ring" style={{ animationDelay: '0.5s' }} />
                        </>
                    )}

                    {/* Logo container */}
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
                        isScanning ? 'glow-cyan' : ''
                    } bg-navy-surface border-2 ${
                        isScanning ? 'border-cyan-glow' : 'border-navy-border'
                    } transition-all duration-500`}>
                        <img
                            src="/assets/generated/bluetooth-logo.dim_256x256.png"
                            alt="Bluetooth"
                            className="w-20 h-20 object-contain"
                            onError={(e) => {
                                // Fallback to icon if image fails
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        {/* Fallback icon overlay */}
                        <Bluetooth
                            className={`absolute w-12 h-12 ${
                                isScanning ? 'text-cyan-glow' : 'text-cyan-dim'
                            } transition-colors duration-300`}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
                    {isScanning ? 'Searching for Devices...' : 'Connect via Bluetooth'}
                </h2>

                {/* Subtitle */}
                <p className="text-muted-foreground text-center text-sm max-w-xs mb-8 leading-relaxed">
                    {!isSupported
                        ? 'Your browser does not support Web Bluetooth. Please use Chrome or Edge on desktop or Android.'
                        : isScanning
                        ? 'Make sure the other device has Bluetooth enabled and is discoverable.'
                        : 'Pair with a nearby Bluetooth device to start messaging without WiFi or mobile data.'}
                </p>

                {/* BLE signal animation */}
                {isScanning && (
                    <div className="flex items-end gap-1 mb-8 h-8">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="w-1.5 rounded-full bg-cyan-glow"
                                style={{
                                    height: `${i * 6}px`,
                                    animation: `bt-fade 1.5s ease-in-out infinite ${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6 max-w-sm text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Unsupported browser warning */}
                {!isSupported && (
                    <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6 max-w-sm text-sm text-destructive">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Browser Not Supported</p>
                            <p>Web Bluetooth requires Chrome 56+ or Edge 79+ on desktop or Android. Safari and Firefox are not supported.</p>
                        </div>
                    </div>
                )}

                {/* Scan button */}
                {isSupported && (
                    <Button
                        onClick={onScan}
                        disabled={isScanning}
                        size="lg"
                        className="gap-2 bg-cyan-glow text-navy-deep hover:bg-cyan-bright font-semibold px-8 py-3 rounded-full glow-cyan transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <>
                                <BluetoothSearching className="w-5 h-5 animate-pulse" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Bluetooth className="w-5 h-5" />
                                Scan for Devices
                            </>
                        )}
                    </Button>
                )}

                {/* Info cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 max-w-lg w-full">
                    {[
                        { icon: '📡', title: 'No Internet Needed', desc: 'Works purely over Bluetooth' },
                        { icon: '🔒', title: 'Direct Connection', desc: 'Device-to-device only' },
                        { icon: '⚡', title: 'Real-time', desc: 'Instant message delivery' },
                    ].map((item) => (
                        <div
                            key={item.title}
                            className="bg-navy-surface border border-navy-border rounded-lg p-3 text-center"
                        >
                            <div className="text-xl mb-1">{item.icon}</div>
                            <div className="text-xs font-semibold text-foreground">{item.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
