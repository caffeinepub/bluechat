export function formatRelativeTime(timestamp: bigint | number): string {
    const now = Date.now();
    const ts = typeof timestamp === 'bigint'
        ? Number(timestamp / 1_000_000n)
        : timestamp;
    const diffMs = now - ts;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    const date = new Date(ts);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatPresenceStatus(lastSeen: bigint | number): string {
    const now = Date.now();
    const ts = typeof lastSeen === 'bigint'
        ? Number(lastSeen / 1_000_000n)
        : lastSeen;
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 2) return 'Online';
    return `Last seen ${formatRelativeTime(lastSeen)}`;
}

export function isOnline(lastSeen: bigint | number): boolean {
    const now = Date.now();
    const ts = typeof lastSeen === 'bigint'
        ? Number(lastSeen / 1_000_000n)
        : lastSeen;
    return (now - ts) < 120_000;
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function formatMessageTime(timestamp: bigint | number): string {
    const ts = typeof timestamp === 'bigint'
        ? Number(timestamp / 1_000_000n)
        : timestamp;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatChatListTime(timestamp: bigint | number): string {
    const now = Date.now();
    const ts = typeof timestamp === 'bigint'
        ? Number(timestamp / 1_000_000n)
        : timestamp;
    const diffMs = now - ts;
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffDay === 0) {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return new Date(ts).toLocaleDateString([], { weekday: 'short' });
    return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
