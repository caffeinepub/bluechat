import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from './UserAvatar';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileScreenProps {
    onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
    const { data: profile, isLoading } = useGetCallerUserProfile();
    const saveProfile = useSaveCallerUserProfile();
    const { clear } = useInternetIdentity();
    const queryClient = useQueryClient();

    const [displayName, setDisplayName] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.displayName);
            setStatusMessage(profile.statusMessage ?? '');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!profile) return;
        setError('');
        if (!displayName.trim()) {
            setError('Display name cannot be empty.');
            return;
        }
        try {
            await saveProfile.mutateAsync({
                ...profile,
                displayName: displayName.trim(),
                statusMessage: statusMessage.trim() || undefined,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            setError('Failed to save profile. Please try again.');
        }
    };

    const handleLogout = async () => {
        await clear();
        queryClient.clear();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-xeta-green" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-xeta-surface border-b border-xeta-border">
                <Button variant="ghost" size="icon" onClick={onBack} className="text-foreground hover:bg-xeta-elevated">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-base font-semibold text-foreground">Profile</h2>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Avatar section */}
                <div className="flex flex-col items-center py-8 bg-xeta-surface border-b border-xeta-border">
                    <UserAvatar
                        displayName={profile?.displayName ?? '?'}
                        avatarUrl={profile?.avatarUrl}
                        size="xl"
                    />
                    <h3 className="mt-3 text-lg font-semibold text-foreground">{profile?.displayName}</h3>
                    <p className="text-sm text-muted-foreground">@{profile?.username}</p>
                </div>

                {/* Edit fields */}
                <div className="px-4 py-6 flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-xeta-green font-semibold uppercase tracking-wider">
                            Your Name
                        </Label>
                        <Input
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="bg-xeta-elevated border-xeta-border text-foreground focus-visible:ring-xeta-green"
                            maxLength={50}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-xeta-green font-semibold uppercase tracking-wider">
                            Username
                        </Label>
                        <Input
                            value={profile?.username ?? ''}
                            disabled
                            className="bg-xeta-surface border-xeta-border text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-xeta-green font-semibold uppercase tracking-wider">
                            About
                        </Label>
                        <Textarea
                            value={statusMessage}
                            onChange={e => setStatusMessage(e.target.value)}
                            placeholder="Hey there! I am using Xeta."
                            className="bg-xeta-elevated border-xeta-border text-foreground focus-visible:ring-xeta-green resize-none"
                            rows={3}
                            maxLength={140}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                    )}

                    <Button
                        onClick={handleSave}
                        disabled={saveProfile.isPending}
                        className="w-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel font-semibold rounded-full"
                    >
                        {saveProfile.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
                        ) : saved ? (
                            <><Check className="w-4 h-4 mr-2" />Saved!</>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>

                    <div className="border-t border-xeta-border pt-4">
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            Log Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
