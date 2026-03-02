import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateUser } from '../hooks/useQueries';
import type { UserProfile } from '../backend';

interface RegistrationScreenProps {
    onRegistered: (profile: UserProfile) => void;
}

export function RegistrationScreen({ onRegistered }: RegistrationScreenProps) {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    const displayNameRef = useRef<HTMLInputElement>(null);

    const createUser = useCreateUser();

    // Defer focus until after the component is fully mounted and stable.
    // This prevents the keyboard from flickering during the auth/loading transition.
    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (mounted && displayNameRef.current) {
            displayNameRef.current.focus();
        }
    }, [mounted]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmedUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
        const trimmedDisplayName = displayName.trim();

        if (trimmedUsername.length < 3) {
            setError('Username must be at least 3 characters.');
            return;
        }
        if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
            setError('Username can only contain letters, numbers, and underscores.');
            return;
        }
        if (trimmedDisplayName.length < 1) {
            setError('Display name is required.');
            return;
        }

        try {
            // mutationFn returns the UserProfile on success, throws on error
            const profile = await createUser.mutateAsync({
                username: trimmedUsername,
                displayName: trimmedDisplayName,
            });
            // Pass the profile directly so App.tsx can immediately show the chat list
            onRegistered(profile);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            // Surface the backend error message directly; it's already human-readable
            if (msg.includes('already') || msg.includes('duplicate') || msg.includes('Username already')) {
                setError('Username is already taken. Please choose another.');
            } else if (msg.includes('Anonymous')) {
                setError('Please sign in before creating an account.');
            } else if (msg.includes('already has an associated account')) {
                setError('This identity already has an account. Please sign in again.');
            } else if (msg.includes('Actor not initialized') || msg.includes('not available')) {
                setError('Connection not ready. Please wait a moment and try again.');
            } else {
                setError(msg || 'Registration failed. Please try again.');
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="w-20 h-20 object-contain mb-4"
                    />
                    <h1 className="text-3xl font-display font-bold text-foreground">Xeta</h1>
                    <p className="text-muted-foreground text-sm mt-1">Create your account to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="displayName" className="text-foreground text-sm font-medium">
                            Your Name
                        </Label>
                        <Input
                            ref={displayNameRef}
                            id="displayName"
                            type="text"
                            placeholder="e.g. Alex Johnson"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            className="bg-xeta-surface border-xeta-border text-foreground placeholder:text-muted-foreground"
                            // No autoFocus — we handle focus manually after mount delay
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="username" className="text-foreground text-sm font-medium">
                            Username
                        </Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="e.g. alex_j"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="bg-xeta-surface border-xeta-border text-foreground placeholder:text-muted-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                            Letters, numbers, and underscores only. Min 3 characters.
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={createUser.isPending}
                        className="w-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel font-semibold rounded-full py-3 mt-2"
                    >
                        {createUser.isPending ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</>
                        ) : (
                            'Create Account'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
