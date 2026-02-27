import { useState, useCallback, useRef } from 'react';

// Nordic UART Service UUIDs - widely supported for custom BLE messaging
export const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const NORDIC_UART_TX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write (send)
export const NORDIC_UART_RX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify (receive)

export type BluetoothState =
    | 'idle'
    | 'scanning'
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'error'
    | 'unsupported';

export interface BluetoothMessage {
    id: string;
    content: string;
    sender: 'local' | 'remote';
    timestamp: Date;
}

export interface UseBluetoothReturn {
    state: BluetoothState;
    device: BluetoothDevice | null;
    deviceName: string | null;
    messages: BluetoothMessage[];
    error: string | null;
    isSupported: boolean;
    scan: () => Promise<void>;
    disconnect: () => void;
    sendMessage: (content: string) => Promise<boolean>;
    clearMessages: () => void;
}

export function useBluetooth(): UseBluetoothReturn {
    const [state, setState] = useState<BluetoothState>(() => {
        if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
            return 'unsupported';
        }
        return 'idle';
    });
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [deviceName, setDeviceName] = useState<string | null>(null);
    const [messages, setMessages] = useState<BluetoothMessage[]>([]);
    const [error, setError] = useState<string | null>(null);

    const txCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const rxCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
    const serverRef = useRef<BluetoothRemoteGATTServer | null>(null);

    const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

    const addMessage = useCallback((content: string, sender: 'local' | 'remote') => {
        const msg: BluetoothMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            content,
            sender,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, msg]);
        return msg;
    }, []);

    const handleDisconnected = useCallback(() => {
        setState('disconnected');
        txCharRef.current = null;
        rxCharRef.current = null;
        serverRef.current = null;
    }, []);

    const scan = useCallback(async () => {
        if (!isSupported) {
            setError('Web Bluetooth API is not supported in this browser. Please use Chrome or Edge on desktop/Android.');
            setState('unsupported');
            return;
        }

        setError(null);
        setState('scanning');

        try {
            const btDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [NORDIC_UART_SERVICE],
            });

            setState('connecting');
            setDevice(btDevice);
            setDeviceName(btDevice.name || 'Unknown Device');

            btDevice.addEventListener('gattserverdisconnected', handleDisconnected);

            if (!btDevice.gatt) {
                throw new Error('GATT not available on this device');
            }

            const server = await btDevice.gatt.connect();
            serverRef.current = server;

            // Try to get Nordic UART service for bidirectional messaging
            let txChar: BluetoothRemoteGATTCharacteristic | null = null;
            let rxChar: BluetoothRemoteGATTCharacteristic | null = null;

            try {
                const service = await server.getPrimaryService(NORDIC_UART_SERVICE);
                txChar = await service.getCharacteristic(NORDIC_UART_TX_CHAR);
                rxChar = await service.getCharacteristic(NORDIC_UART_RX_CHAR);

                // Start listening for incoming messages
                await rxChar.startNotifications();
                rxChar.addEventListener('characteristicvaluechanged', (event: Event) => {
                    const target = event.target as BluetoothRemoteGATTCharacteristic;
                    if (target.value) {
                        const decoder = new TextDecoder('utf-8');
                        const text = decoder.decode(target.value);
                        addMessage(text, 'remote');
                    }
                });

                txCharRef.current = txChar;
                rxCharRef.current = rxChar;
            } catch {
                // Device doesn't support Nordic UART - still allow connection for demo
                // In a real scenario both devices need the same BLE service
                txCharRef.current = null;
                rxCharRef.current = null;
            }

            setState('connected');
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.name === 'NotFoundError' || err.message.includes('cancelled')) {
                    // User cancelled the device picker
                    setState('idle');
                    return;
                }
                setError(err.message);
            } else {
                setError('Failed to connect to Bluetooth device');
            }
            setState('error');
            setDevice(null);
            setDeviceName(null);
        }
    }, [isSupported, handleDisconnected, addMessage]);

    const disconnect = useCallback(() => {
        if (device?.gatt?.connected) {
            device.gatt.disconnect();
        }
        setDevice(null);
        setDeviceName(null);
        txCharRef.current = null;
        rxCharRef.current = null;
        serverRef.current = null;
        setState('idle');
    }, [device]);

    const sendMessage = useCallback(async (content: string): Promise<boolean> => {
        if (!content.trim()) return false;

        if (txCharRef.current) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(content);
                // BLE has a max write size; chunk if needed (20 bytes typical MTU)
                const chunkSize = 20;
                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, i + chunkSize);
                    await txCharRef.current.writeValue(chunk);
                }
                addMessage(content, 'local');
                return true;
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(`Send failed: ${err.message}`);
                }
                return false;
            }
        } else {
            // No TX characteristic available - still add locally for demo/testing
            addMessage(content, 'local');
            return true;
        }
    }, [addMessage]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return {
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
    };
}
