import React, { useState } from 'react';
import { ArrowLeft, Search, Loader2, X, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserAvatar } from './UserAvatar';
import { useCreateGroupChat, useGetCallerUserProfile } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import type { UserProfile } from '../backend';

interface CreateGroupScreenProps {
    onBack: () => void;
    onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupScreen({ onBack, onGroupCreated }: CreateGroupScreenProps) {
    const [step, setStep] = useState<'select' | 'name'>('select');
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<UserProfile[]>([]);
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');

    const { data: currentProfile } = useGetCallerUserProfile();
    const { actor } = useActor();
    const createGroup = useCreateGroupChat();

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

    const toggleContact = (contact: UserProfile) => {
        setSelectedContacts(prev =>
            prev.find(c => c.id === contact.id)
                ? prev.filter(c => c.id !== contact.id)
                : [...prev, contact]
        );
    };

    const handleCreateGroup = async () => {
        setError('');
        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }
        if (selectedContacts.length < 1) {
            setError('Select at least one participant.');
            return;
        }
        try {
            const conv = await createGroup.mutateAsync({
                participants: selectedContacts.map(c => c.id),
                groupName: groupName.trim(),
            });
            onGroupCreated(conv.id);
        } catch {
            setError('Failed to create group. Please try again.');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-xeta-surface border-b border-xeta-border">
                <Button variant="ghost" size="icon" onClick={step === 'name' ? () => setStep('select') : onBack} className="text-foreground hover:bg-xeta-elevated">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-base font-semibold text-foreground">
                        {step === 'select' ? 'Add Participants' : 'New Group'}
                    </h2>
                    {step === 'select' && selectedContacts.length > 0 && (
                        <p className="text-xs text-muted-foreground">{selectedContacts.length} selected</p>
                    )}
                </div>
                {step === 'select' && selectedContacts.length > 0 && (
                    <Button
                        onClick={() => setStep('name')}
                        className="bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel rounded-full px-4"
                    >
                        Next
                    </Button>
                )}
            </div>

            {step === 'select' && (
                <>
                    {/* Selected chips */}
                    {selectedContacts.length > 0 && (
                        <div className="flex flex-wrap gap-2 px-4 py-2 bg-xeta-surface border-b border-xeta-border">
                            {selectedContacts.map(c => (
                                <span key={c.id} className="flex items-center gap-1 bg-xeta-elevated rounded-full px-2 py-1 text-xs text-foreground">
                                    {c.displayName}
                                    <button onClick={() => toggleContact(c)} className="text-muted-foreground hover:text-foreground">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="px-4 py-3 bg-xeta-surface border-b border-xeta-border">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by username..."
                                    className="pl-9 bg-xeta-elevated border-xeta-border text-foreground placeholder:text-muted-foreground focus-visible:ring-xeta-green"
                                />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching || !search.trim()}
                                className="bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel"
                            >
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {searchResult && searchResult !== 'not-found' && (
                            <button
                                onClick={() => toggleContact(searchResult)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-xeta-elevated transition-colors border-b border-xeta-border"
                            >
                                <Checkbox
                                    checked={!!selectedContacts.find(c => c.id === searchResult.id)}
                                    className="border-xeta-border data-[state=checked]:bg-xeta-green data-[state=checked]:border-xeta-green"
                                />
                                <UserAvatar displayName={searchResult.displayName} avatarUrl={searchResult.avatarUrl} size="md" />
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-semibold text-foreground truncate">{searchResult.displayName}</p>
                                    <p className="text-xs text-muted-foreground">@{searchResult.username}</p>
                                </div>
                            </button>
                        )}
                        {searchResult === 'not-found' && (
                            <p className="text-center text-muted-foreground text-sm py-8">No user found.</p>
                        )}
                        {!searchResult && (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <Users className="w-12 h-12 text-muted-foreground mb-3" />
                                <p className="text-muted-foreground text-sm">Search for people to add to the group.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {step === 'name' && (
                <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5">
                    <div className="flex flex-col items-center gap-3 mb-2">
                        <div className="w-20 h-20 rounded-full bg-xeta-elevated flex items-center justify-center">
                            <Users className="w-9 h-9 text-xeta-green" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-xeta-green font-semibold uppercase tracking-wider">
                            Group Name
                        </Label>
                        <Input
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className="bg-xeta-elevated border-xeta-border text-foreground focus-visible:ring-xeta-green"
                            maxLength={50}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-xs text-xeta-green font-semibold uppercase tracking-wider">
                            Participants ({selectedContacts.length})
                        </p>
                        {selectedContacts.map(c => (
                            <div key={c.id} className="flex items-center gap-3 py-1">
                                <UserAvatar displayName={c.displayName} avatarUrl={c.avatarUrl} size="sm" />
                                <span className="text-sm text-foreground">{c.displayName}</span>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                    )}

                    <Button
                        onClick={handleCreateGroup}
                        disabled={createGroup.isPending}
                        className="w-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel font-semibold rounded-full mt-2"
                    >
                        {createGroup.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</>
                        ) : (
                            'Create Group'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
