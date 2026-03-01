import React from 'react';
import type { Message } from '../backend';
import { MessageType, MessageStatus } from '../backend';
import { ReceiptIcon } from './ReceiptIcon';
import { formatMessageTime } from '../utils/formatters';

interface MessageBubbleProps {
    message: Message;
    currentUserId: string;
    senderName?: string;
    showSenderName?: boolean;
}

export function MessageBubble({ message, currentUserId, senderName, showSenderName = false }: MessageBubbleProps) {
    const isSent = message.senderId === currentUserId;

    const renderContent = () => {
        if (message.messageType === MessageType.image && message.mediaFile) {
            return (
                <div className="flex flex-col gap-1">
                    <img
                        src={message.mediaFile.media.getDirectURL()}
                        alt="Shared image"
                        className="max-w-[220px] rounded-lg object-cover"
                        loading="lazy"
                    />
                    {message.content && (
                        <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    )}
                </div>
            );
        }

        if (message.messageType === MessageType.file && message.mediaFile) {
            return (
                <a
                    href={message.mediaFile.media.getDirectURL()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm underline underline-offset-2 hover:opacity-80"
                >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{message.content || 'Download file'}</span>
                </a>
            );
        }

        return <p className="text-sm leading-relaxed break-words">{message.content}</p>;
    };

    return (
        <div className={`flex flex-col gap-0.5 animate-fade-in-up ${isSent ? 'items-end' : 'items-start'}`}>
            {showSenderName && !isSent && senderName && (
                <span className="text-xs font-semibold px-1" style={{ color: 'oklch(0.72 0.17 155)' }}>
                    {senderName}
                </span>
            )}

            <div
                className={`relative max-w-[72%] px-3.5 py-2 text-sm leading-relaxed break-words ${
                    isSent
                        ? 'bg-sent-bubble text-foreground rounded-bubble rounded-br-bubble-sm shadow-green-glow-sm'
                        : 'bg-received-bubble text-foreground rounded-bubble rounded-bl-bubble-sm border border-xeta-border'
                }`}
            >
                {renderContent()}

                <div className={`flex items-center gap-1 mt-0.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-60">
                        {formatMessageTime(message.timestamp)}
                    </span>
                    {isSent && (
                        <ReceiptIcon status={message.status} />
                    )}
                </div>
            </div>
        </div>
    );
}
