import React, { useState, useMemo } from 'react';
import { MessageSquarePlus, Users, User, Search, Plus, Bot, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from './UserAvatar';
import { useGetMyConversations, useGetCallerUserProfile, useGetAllUsers, useCreateOneOnOneConversation } from '../hooks/useQueries';
import { ConversationType } from '../backend';
import type { ConversationView } from '../backend';
import { formatChatListTime } from '../utils/formatters';

interface ChatListScreenProps {
    currentUserId: string;
    onOpenChat: (conversation: ConversationView) => void;
    onNewChat: () => void;
    onNewGroup: () => void;
    onOpenProfile: () => void;
    onOpenXetaAI: () => void;
}

export function ChatListScreen({ currentUserId, onOpenChat, onNewChat, onNewGroup, onOpenProfile, onOpenXetaAI }: ChatListScreenProps) {
    const { data: conversations = [], isLoading } = useGetMyConversations();
    const { data: currentProfile } = useGetCallerUserProfile();
    const { data: allUsers = [] } = useGetAllUsers();
    const createOneOnOne = useCreateOneOnOneConversation();

    const [showFab, setShowFab] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const sorted = [...conversations].sort((a, b) => {
        const aTime = Number(a.timestamp);
        const bTime = Number(b.timestamp);
        const aLastMsg = a.messages.length > 0 ? Number(a.messages[a.messages.length - 1].timestamp) : aTime;
        const bLastMsg = b.messages.length > 0 ? Number(b.messages[b.messages.length - 1].timestamp) : bTime;
        return bLastMsg - aLastMsg;
    });

    // Filter users for search (exclude self)
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return allUsers.filter(u =>
            u.id !== currentUserId &&
            (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q))
        );
    }, [searchQuery, allUsers, currentUserId]);

    const isSearching = searchQuery.trim().length > 0;

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

    const handleSelectUser = async (userId: string) => {
        try {
            const conv = await createOneOnOne.mutateAsync(userId);
            setSearchQuery('');
            onOpenChat(conv);
        } catch {
            // ignore
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="h-12 w-12 object-contain"
                    />
                    <h1 className="text-xl font-display font-bold text-foreground leading-none">Xeta</h1>
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

            {/* Search bar */}
            <div className="px-3 py-2 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="pl-9 pr-8 bg-xeta-elevated border-xeta-border text-foreground placeholder:text-muted-foreground focus-visible:ring-xeta-green rounded-full text-sm h-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Xeta AI pinned entry — always visible, not filtered */}
            {!isSearching && (
                <button
                    onClick={onOpenXetaAI}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors border-b border-xeta-border bg-xeta-surface/60 flex-shrink-0"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-xeta-green to-xeta-green-dim flex items-center justify-center flex-shrink-0 shadow-green-glow-sm">
                        <Bot className="w-5 h-5 text-xeta-panel" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold text-foreground">Xeta AI</p>
                        <p className="text-xs text-xeta-green truncate">Your intelligent assistant</p>
                    </div>
                    <span className="text-[10px] text-xeta-green font-medium bg-xeta-green/10 px-2 py-0.5 rounded-full">AI</span>
                </button>
            )}

            {/* New Chat FAB row — always visible, not filtered */}
            {!isSearching && (
                <div className="flex gap-2 px-4 py-2 border-b border-xeta-border/50 flex-shrink-0">
                    <button
                        onClick={onNewChat}
                        className="flex items-center gap-2 text-xs text-xeta-green hover:text-xeta-green-bright transition-colors py-1"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                    <span className="text-xeta-border">·</span>
                    <button
                        onClick={onNewGroup}
                        className="flex items-center gap-2 text-xs text-xeta-green hover:text-xeta-green-bright transition-colors py-1"
                    >
                        <Users className="w-4 h-4" />
                        New Group
                    </button>
                </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Search results */}
                {isSearching && (
                    <>
                        {filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <Search className="w-8 h-8 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground text-sm">No users found for "{searchQuery}"</p>
                                <p className="text-muted-foreground text-xs mt-1">Try a different name or username.</p>
                            </div>
                        ) : (
                            <>
                                <p className="px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                    Users
                                </p>
                                {filteredUsers.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.id)}
                                        disabled={createOneOnOne.isPending}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors border-b border-xeta-border/50 disabled:opacity-60"
                                    >
                                        <UserAvatar displayName={user.displayName} avatarUrl={user.avatarUrl} size="md" />
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                        {createOneOnOne.isPending && (
                                            <Loader2 className="w-4 h-4 animate-spin text-xeta-green" />
                                        )}
                                    </button>
                                ))}
                            </>
                        )}
                    </>
                )}

                {/* Conversation list */}
                {!isSearching && (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-xeta-green" />
                            </div>
                        ) : sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                <div className="w-20 h-20 rounded-full bg-xeta-elevated flex items-center justify-center mb-5">
                                    <MessageSquarePlus className="w-9 h-9 text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-1">No conversations yet</h3>
                                <p className="text-muted-foreground text-sm">
                                    Search for users above or tap New Chat to get started.
                                </p>
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
                                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{getLastTime(conv)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{getLastMessage(conv)}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </>
                )}
            </div>

            {/* FAB for new chat (floating, only when not searching) */}
            {!isSearching && (
                <div className="absolute bottom-4 right-4">
                    {showFab && (
                        <div className="absolute bottom-14 right-0 flex flex-col gap-2 items-end animate-fade-in-up">
                            <button
                                onClick={() => { setShowFab(false); onNewGroup(); }}
                                className="flex items-center gap-2 bg-xeta-elevated border border-xeta-border text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-card-dark hover:bg-xeta-surface transition-colors"
                            >
                                <Users className="w-4 h-4 text-xeta-green" />
                                New Group
                            </button>
                            <button
                                onClick={() => { setShowFab(false); onNewChat(); }}
                                className="flex items-center gap-2 bg-xeta-elevated border border-xeta-border text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-card-dark hover:bg-xeta-surface transition-colors"
                            >
                                <MessageSquarePlus className="w-4 h-4 text-xeta-green" />
                                New Chat
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowFab(v => !v)}
                        className="w-12 h-12 rounded-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel flex items-center justify-center shadow-green-glow transition-colors"
                    >
                        <Plus className={`w-6 h-6 transition-transform ${showFab ? 'rotate-45' : ''}`} />
                    </button>
                </div>
            )}
        </div>
    );
}
