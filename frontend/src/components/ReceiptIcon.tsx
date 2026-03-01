import React from 'react';
import { MessageStatus } from '../backend';

interface ReceiptIconProps {
    status: MessageStatus;
    className?: string;
}

export function ReceiptIcon({ status, className = '' }: ReceiptIconProps) {
    if (status === MessageStatus.sent) {
        return (
            <svg
                className={`inline-block w-3.5 h-3.5 text-muted-foreground ${className}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="2,8 6,12 14,4" />
            </svg>
        );
    }

    if (status === MessageStatus.delivered) {
        return (
            <svg
                className={`inline-block w-4 h-3.5 text-muted-foreground ${className}`}
                viewBox="0 0 20 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="1,8 5,12 13,4" />
                <polyline points="7,8 11,12 19,4" />
            </svg>
        );
    }

    if (status === MessageStatus.read) {
        return (
            <svg
                className={`inline-block w-4 h-3.5 ${className}`}
                viewBox="0 0 20 16"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ stroke: 'oklch(0.72 0.17 155)' }}
            >
                <polyline points="1,8 5,12 13,4" />
                <polyline points="7,8 11,12 19,4" />
            </svg>
        );
    }

    return null;
}
