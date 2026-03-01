import React from 'react';
import { getInitials } from '../utils/formatters';

interface UserAvatarProps {
    displayName: string;
    avatarUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
};

export function UserAvatar({ displayName, avatarUrl, size = 'md', className = '' }: UserAvatarProps) {
    const initials = getInitials(displayName);
    const sizeClass = sizeClasses[size];

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={displayName}
                className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
            />
        );
    }

    // Generate a consistent color based on name
    const hue = (displayName.charCodeAt(0) * 37 + displayName.charCodeAt(displayName.length - 1) * 13) % 360;

    return (
        <div
            className={`${sizeClass} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
            style={{ background: `oklch(0.38 0.12 ${hue})`, color: 'oklch(0.95 0.01 200)' }}
        >
            {initials}
        </div>
    );
}
