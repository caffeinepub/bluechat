import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { addCallHistoryEntry } from '../types/calls';

interface VideoCallOverlayProps {
    contactId: string;
    contactName: string;
    onClose: () => void;
}

export default function VideoCallOverlay({ contactId, contactName, onClose }: VideoCallOverlayProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callStatus, setCallStatus] = useState<'connecting' | 'active'>('connecting');
    const [duration, setDuration] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
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
            .getUserMedia({ audio: true, video: true })
            .then(stream => {
                if (cancelled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
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
            callType: 'video',
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

    const toggleCamera = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(t => {
                t.enabled = isCameraOff;
            });
        }
        setIsCameraOff(prev => !prev);
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
            {/* Remote video area (placeholder — no peer connection) */}
            <div className="flex-1 flex items-center justify-center bg-xeta-panel relative">
                <div className="flex flex-col items-center gap-3">
                    <UserAvatar displayName={contactName} size="xl" />
                    <p className="text-foreground text-xl font-semibold">{contactName}</p>
                    <p className="text-muted-foreground text-sm">
                        {callStatus === 'connecting' ? 'Connecting…' : formatDuration(duration)}
                    </p>
                </div>

                {/* Local video PiP */}
                <div className="absolute bottom-4 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-xeta-border bg-xeta-elevated">
                    {!isCameraOff ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <VideoOff size={24} className="text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6 py-8 bg-xeta-panel">
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isMuted ? 'bg-xeta-elevated text-muted-foreground' : 'bg-xeta-surface text-foreground'
                    }`}
                >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                <button
                    onClick={handleEnd}
                    className="w-[72px] h-[72px] rounded-full bg-destructive flex items-center justify-center text-white shadow-lg"
                >
                    <PhoneOff size={26} />
                </button>

                <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                        isCameraOff ? 'bg-xeta-elevated text-muted-foreground' : 'bg-xeta-surface text-foreground'
                    }`}
                >
                    {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
                </button>
            </div>
        </div>
    );
}
