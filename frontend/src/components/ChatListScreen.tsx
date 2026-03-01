import React, { useState } from 'react';
import { MessageSquarePlus, Users, User, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import { useGetMyConversations, useGetCallerUserProfile } from '../hooks/useQueries';
import { ConversationType } from '../backend';
import type { ConversationView } from '../backend';
import { formatChatListTime } from '../utils/formatters';

interface ChatListScreenProps {
    currentUserId: string;
    onOpenChat: (conversation: ConversationView) => void;
    onNewChat: () => void;
    onNewGroup: () => void;
    onOpenProfile: () => void;
}

export function ChatListScreen({ currentUserId, onOpenChat, onNewChat, onNewGroup, onOpenProfile }: ChatListScreenProps) {
    const { data: conversations = [], isLoading } = useGetMyConversations();
    const { data: currentProfile } = useGetCallerUserProfile();
    const [showFab, setShowFab] = useState(false);

    const sorted = [...conversations].sort((a, b) => {
        const aTime = Number(a.timestamp);
        const bTime = Number(b.timestamp);
        // Use last message time if available
        const aLastMsg = a.messages.length > 0 ? Number(a.messages[a.messages.length - 1].timestamp) : aTime;
        const bLastMsg = b.messages.length > 0 ? Number(b.messages[b.messages.length - 1].timestamp) : bTime;
        return bLastMsg - aLastMsg;
    });

    const getConvName = (conv: ConversationView): string => {
        if (conv.conversationType === ConversationType.group) return conv.name;
        const otherId = conv.participants.find(p => p !== currentUserId);
        return otherId ?? 'Unknown';
    };

    const getLastMessage = (conv: ConversationView): string => {
        if (conv.messages.length === 0) return 'No messages yet';
        const last = conv.messages[conv.messages.length - 1];
        if (last.messageType === 'image' as unknown) return '📷 Image';
        if (last.messageType === 'file' as unknown) return '📎 File';
        return last.content.length > 35 ? last.content.slice(0, 35) + '…' : last.content;
    };

    const getLastTime = (conv: ConversationView): string => {
        if (conv.messages.length === 0) return formatChatListTime(conv.timestamp);
        return formatChatListTime(conv.messages[conv.messages.length - 1].timestamp);
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="w-8 h-8 object-contain"
                    />
                    <h1 className="text-xl font-display font-bold text-foreground">Xeta</h1>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onOpenProfile}
                        className="text-muted-foreground hover:text-foreground hover:bg-xeta-elevated"
                    >
                        <User className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-xeta-green" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-20 h-20 rounded-full bg-xeta-elevated flex items-center justify-center mb-5">
                            <MessageSquarePlus className="w-9 h-9 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground mb-1">No conversations yet</h3>
                        <p className="text-muted-foreground text-sm">
                            Start a new chat or create a group to get started.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <Button
                                onClick={onNewChat}
                                className="bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel rounded-full px-5"
                            >
                                New Chat
                            </Button>
                            <Button
                                onClick={onNewGroup}
                                variant="outline"
                                className="border-xeta-border text-foreground hover:bg-xeta-elevated rounded-full px-5"
                            >
                                New Group
                            </Button>
                        </div>
                    </div>
                ) : (
                    sorted.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => onOpenChat(conv)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors border-b border-xeta-border/50"
                        >
                            {conv.conversationType === ConversationType.group ? (
                                <div className="w-10 h-10 rounded-full bg-xeta-elevated flex items-center justify-center flex-shrink-0">
                                    <Users className="w-5 h-5 text-xeta-green" />
                                </div>
                            ) : (
                                <UserAvatar
                                    displayName={getConvName(conv)}
                                    size="md"
                                />
                            )}
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-foreground truncate">{getConvName(conv)}</p>
                                    <span className="text-xs text-muted-foreground flex-shrink-0">{getLastTime(conv)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{getLastMessage(conv)}</p>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* FAB */}
            <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2">
                {showFab && (
                    <>
                        <button
                            onClick={() => { setShowFab(false); onNewGroup(); }}
                            className="flex items-center gap-2 bg-xeta-surface border border-xeta-border rounded-full px-4 py-2 text-sm text-foreground shadow-card-dark hover:bg-xeta-elevated transition-colors animate-fade-in-up"
                        >
                            <Users className="w-4 h-4 text-xeta-green" />
                            New Group
                        </button>
                        <button
                            onClick={() => { setShowFab(false); onNewChat(); }}
                            className="flex items-center gap-2 bg-xeta-surface border border-xeta-border rounded-full px-4 py-2 text-sm text-foreground shadow-card-dark hover:bg-xeta-elevated transition-colors animate-fade-in-up"
                        >
                            <MessageSquarePlus className="w-4 h-4 text-xeta-green" />
                            New Chat
                        </button>
                    </>
                )}
                <button
                    onClick={() => setShowFab(v => !v)}
                    className="w-14 h-14 rounded-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel flex items-center justify-center shadow-green-glow transition-all duration-200"
                >
                    <MessageSquarePlus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
