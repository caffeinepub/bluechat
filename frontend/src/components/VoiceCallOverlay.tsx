import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { addCallHistoryEntry } from '../types/calls';

interface VoiceCallOverlayProps {
    contactId: string;
    contactName: string;
    onClose: () => void;
}

export default function VoiceCallOverlay({ contactId, contactName, onClose }: VoiceCallOverlayProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [callStatus, setCallStatus] = useState<'connecting' | 'active'>('connecting');
    const [duration, setDuration] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        let cancelled = false;

        const startTimer = () => {
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
        };

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then(stream => {
                if (cancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                setCallStatus('active');
                startTimer();
            })
            .catch(() => {
                if (!cancelled) {
                    setCallStatus('active');
                    startTimer();
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleEnd = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        addCallHistoryEntry({
            id: `call_${Date.now()}`,
            contactId,
            contactName,
            callType: 'voice',
            timestamp: Date.now(),
            duration: finalDuration,
            direction: 'outgoing',
        });
        onClose();
    };

    const toggleMute = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(t => {
                t.enabled = isMuted;
            });
        }
        setIsMuted(prev => !prev);
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-xeta-panel py-16">
            <div className="flex flex-col items-center gap-4 mt-8">
                <UserAvatar displayName={contactName} size="xl" />
                <h2 className="text-2xl font-bold text-foreground">{contactName}</h2>
                <p className="text-muted-foreground text-sm">
                    {callStatus === 'connecting' ? 'Connecting…' : formatDuration(duration)}
                </p>
            </div>

            <div className="flex items-center gap-8 mb-8">
                <button
                    onClick={toggleMute}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                        isMuted
                            ? 'bg-xeta-elevated text-muted-foreground'
                            : 'bg-xeta-surface text-foreground'
                    }`}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <button
                    onClick={handleEnd}
                    className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center text-white shadow-lg"
                >
                    <PhoneOff size={28} />
                </button>
            </div>
        </div>
    );
}
