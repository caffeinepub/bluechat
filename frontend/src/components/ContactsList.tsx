import React, { useState } from 'react';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './UserAvatar';
import { PresenceIndicator } from './PresenceIndicator';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQuery } from '@tanstack/react-query';
import type { UserProfile } from '../backend';

interface ContactsListProps {
    onSelectContact: (userId: string) => void;
    onBack: () => void;
}

function useGetAllUsers() {
    const { actor, isFetching } = useActor();
    return useQuery<UserProfile[]>({
        queryKey: ['allUsers'],
        queryFn: async () => {
            if (!actor) return [];
            // We fetch conversations to get participant IDs, then fetch profiles
            // Since there's no getAllUsers endpoint, we use getMyConversations to find known users
            // and also expose a workaround via getContactById for known IDs
            // For now, return empty and let the search work via username lookup
            return [];
        },
        enabled: !!actor && !isFetching,
        staleTime: 30_000,
    });
}

export function ContactsList({ onSelectContact, onBack }: ContactsListProps) {
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
    const [isSearching, setIsSearching] = useState(false);
    const { data: currentProfile } = useGetCallerUserProfile();
    const { actor } = useActor();

    const handleSearch = async () => {
        if (!search.trim() || !actor) return;
        setIsSearching(true);
        setSearchResult(null);
        try {
            const profile = await actor.getContactById(search.trim().toLowerCase());
            if (profile && profile.id !== currentProfile?.id) {
                setSearchResult(profile);
            } else {
                setSearchResult('not-found');
            }
        } catch {
            setSearchResult('not-found');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-xeta-surface border-b border-xeta-border">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-foreground hover:bg-xeta-elevated">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-base font-semibold text-foreground">New Chat</h2>
            </div>

            {/* Search */}
            <div className="px-4 py-3 bg-xeta-surface border-b border-xeta-border">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search by username..."
                            className="pl-9 bg-xeta-elevated border-xeta-border text-foreground placeholder:text-muted-foreground focus-visible:ring-xeta-green"
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        disabled={isSearching || !search.trim()}
                        className="bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Enter the exact username to find a contact.</p>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
                {searchResult === 'not-found' && (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <p className="text-muted-foreground text-sm">No user found with that username.</p>
                        <p className="text-muted-foreground text-xs mt-1">Make sure you enter the exact username.</p>
                    </div>
                )}

                {searchResult && searchResult !== 'not-found' && (
                    <button
                        onClick={() => onSelectContact(searchResult.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors border-b border-xeta-border"
                    >
                        <UserAvatar displayName={searchResult.displayName} avatarUrl={searchResult.avatarUrl} size="md" />
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-foreground truncate">{searchResult.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">@{searchResult.username}</p>
                        </div>
                        <PresenceIndicator lastSeen={searchResult.lastSeen} showDot={true} />
                    </button>
                )}

                {!searchResult && !isSearching && (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-16 h-16 rounded-full bg-xeta-elevated flex items-center justify-center mb-4">
                            <Search className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Find people on Xeta</p>
                        <p className="text-muted-foreground text-xs mt-1">Search by their exact username to start a chat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
