import React, { useState, useMemo } from 'react';
import { MessageSquarePlus, Users, Search, Plus, Loader2, X, User } from 'lucide-react';
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
}

export function ChatListScreen({ currentUserId, onOpenChat, onNewChat, onNewGroup, onOpenProfile }: ChatListScreenProps) {
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

    // Suppress unused variable warning — currentProfile may be used for future features
    void currentProfile;

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
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

            {/* Search Bar */}
            <div className="px-4 py-2 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search people or chats…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-9 bg-xeta-elevated border-xeta-border text-foreground placeholder:text-muted-foreground rounded-full h-9 text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
                {/* Search Results */}
                {isSearching && (
                    <div>
                        {filteredUsers.length === 0 ? (
                            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                No users found for "{searchQuery}"
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors text-left"
                                >
                                    <UserAvatar displayName={user.displayName} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{user.displayName}</p>
                                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Conversation List */}
                {!isSearching && (
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-xeta-green" />
                            </div>
                        ) : sorted.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-xeta-elevated flex items-center justify-center">
                                    <MessageSquarePlus className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground text-sm">No conversations yet.</p>
                                <p className="text-xs text-muted-foreground">
                                    Tap the <span className="text-xeta-green font-medium">+</span> button to start chatting.
                                </p>
                            </div>
                        ) : (
                            sorted.map(conv => {
                                const name = getConvName(conv);
                                const lastMsg = getLastMessage(conv);
                                const lastTime = getLastTime(conv);

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => onOpenChat(conv)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors text-left border-b border-xeta-border/30"
                                    >
                                        <div className="relative flex-shrink-0">
                                            <UserAvatar
                                                displayName={name}
                                                size="md"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                                                <span className="text-xs text-muted-foreground flex-shrink-0">{lastTime}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsg}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </>
                )}
            </div>

            {/* FAB */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-20">
                {showFab && (
                    <div className="flex flex-col items-end gap-2 mb-1">
                        <button
                            onClick={() => { setShowFab(false); onNewGroup(); }}
                            className="flex items-center gap-2 bg-xeta-surface border border-xeta-border text-foreground text-sm font-medium rounded-full px-4 py-2 shadow-lg hover:bg-xeta-elevated transition-colors"
                        >
                            <Users className="w-4 h-4 text-xeta-green" />
                            New Group
                        </button>
                        <button
                            onClick={() => { setShowFab(false); onNewChat(); }}
                            className="flex items-center gap-2 bg-xeta-surface border border-xeta-border text-foreground text-sm font-medium rounded-full px-4 py-2 shadow-lg hover:bg-xeta-elevated transition-colors"
                        >
                            <MessageSquarePlus className="w-4 h-4 text-xeta-green" />
                            New Chat
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setShowFab(v => !v)}
                    className="w-14 h-14 rounded-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel flex items-center justify-center shadow-xeta-glow transition-all"
                    aria-label="New conversation"
                >
                    {showFab ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}
