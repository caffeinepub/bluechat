import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUpdateLastSeen, useCreateOneOnOneConversation } from './hooks/useQueries';
import { RegistrationScreen } from './components/RegistrationScreen';
import { ChatListScreen } from './components/ChatListScreen';
import { ChatScreen } from './components/ChatScreen';
import { ContactsList } from './components/ContactsList';
import { CreateGroupScreen } from './components/CreateGroupScreen';
import { ProfileScreen } from './components/ProfileScreen';
import type { ConversationView } from './backend';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// How long (ms) to wait before showing a timeout/retry UI
const PROFILE_FETCH_TIMEOUT_MS = 15_000;

type Screen =
    | { type: 'chat-list' }
    | { type: 'chat'; conversation: ConversationView }
    | { type: 'contacts' }
    | { type: 'create-group' }
    | { type: 'profile' };

export default function App() {
    const { login, loginStatus, identity, clear } = useInternetIdentity();
    const isAuthenticated = !!identity;
    const isLoggingIn = loginStatus === 'logging-in';
    const queryClient = useQueryClient();

    const {
        data: userProfile,
        isLoading: profileLoading,
        isFetched: profileFetched,
        isError: profileError,
        refetch: refetchProfile,
    } = useGetCallerUserProfile();

    const updateLastSeen = useUpdateLastSeen();
    const createOneOnOne = useCreateOneOnOneConversation();

    const [screen, setScreen] = React.useState<Screen>({ type: 'chat-list' });

    // Track whether registration just completed so we can skip the profile-null
    // check while the query refetch is in-flight.
    const [justRegistered, setJustRegistered] = useState(false);

    // Timeout state: if loading takes too long, show a retry option
    const [timedOut, setTimedOut] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Start timeout when authenticated but profile not yet fetched
    useEffect(() => {
        if (isAuthenticated && profileLoading && !profileFetched) {
            setTimedOut(false);
            timeoutRef.current = setTimeout(() => {
                setTimedOut(true);
            }, PROFILE_FETCH_TIMEOUT_MS);
        } else {
            // Clear timeout once loading resolves
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (profileFetched || profileError) {
                setTimedOut(false);
            }
        }
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isAuthenticated, profileLoading, profileFetched, profileError]);

    // Once the profile query resolves after registration, clear the justRegistered flag
    useEffect(() => {
        if (justRegistered && userProfile) {
            setJustRegistered(false);
        }
    }, [justRegistered, userProfile]);

    // Update last seen on mount and periodically
    useEffect(() => {
        if (isAuthenticated && userProfile) {
            updateLastSeen.mutate();
            const interval = setInterval(() => updateLastSeen.mutate(), 60_000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, userProfile]);

    const handleSelectContact = useCallback(async (userId: string) => {
        try {
            const conv = await createOneOnOne.mutateAsync(userId);
            setScreen({ type: 'chat', conversation: conv });
        } catch {
            // ignore
        }
    }, [createOneOnOne]);

    const handleGroupCreated = useCallback((_conversationId: string) => {
        setScreen({ type: 'chat-list' });
    }, []);

    const handleLogout = useCallback(async () => {
        await clear();
        queryClient.clear();
        setJustRegistered(false);
        setScreen({ type: 'chat-list' });
    }, [clear, queryClient]);

    const handleRetry = useCallback(() => {
        setTimedOut(false);
        refetchProfile();
    }, [refetchProfile]);

    // Called by RegistrationScreen after a successful createUser call.
    // useCreateUser already sets the query cache with the new profile, so
    // userProfile will be non-null on the next render — no need to wait for
    // a full refetch before showing the chat list.
    const handleRegistered = useCallback(() => {
        setJustRegistered(true);
        setScreen({ type: 'chat-list' });
    }, []);

    // ── Not authenticated ──────────────────────────────────────────────────────
    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
                <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="w-24 h-24 object-contain"
                    />
                    <div className="text-center">
                        <h1 className="text-4xl font-display font-bold text-foreground">Xeta</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Simple, fast, and secure messaging.
                        </p>
                    </div>

                    <button
                        onClick={login}
                        disabled={isLoggingIn}
                        className="w-full flex items-center justify-center gap-2 bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel font-semibold rounded-full py-3 px-6 transition-colors disabled:opacity-60"
                    >
                        {isLoggingIn ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Connecting...</>
                        ) : (
                            'Get Started'
                        )}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                        Secured by Internet Identity. No passwords needed.
                    </p>
                </div>

                <footer className="absolute bottom-4 text-center text-xs text-muted-foreground">
                    Built with ❤️ using{' '}
                    <a
                        href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'xeta-app')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-xeta-green"
                    >
                        caffeine.ai
                    </a>{' '}
                    · © {new Date().getFullYear()}
                </footer>
            </div>
        );
    }

    // ── Loading profile ────────────────────────────────────────────────────────
    // Show loading only while genuinely waiting; once fetched or errored, move on.
    // Skip the loading screen if we just registered (cache is already populated).
    const isLoadingProfile = profileLoading && !profileFetched && !profileError && !justRegistered;

    if (isLoadingProfile) {
        // Timed out — show retry UI instead of infinite spinner
        if (timedOut) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-4">
                    <img
                        src="/assets/generated/xeta-logo.dim_128x128.png"
                        alt="Xeta"
                        className="w-16 h-16 object-contain opacity-60"
                    />
                    <p className="text-muted-foreground text-sm text-center">
                        Taking longer than expected…
                    </p>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel font-semibold rounded-full py-2 px-5 transition-colors text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry
                    </button>
                    <button
                        onClick={handleLogout}
                        className="text-xs text-muted-foreground underline hover:text-foreground"
                    >
                        Sign out
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-xeta-green" />
                <p className="text-muted-foreground text-sm">Loading your profile…</p>
            </div>
        );
    }

    // ── Registration ───────────────────────────────────────────────────────────
    // Show registration only when profile is confirmed null (not just registered).
    if (!userProfile && !justRegistered) {
        return (
            <>
                <RegistrationScreen onRegistered={handleRegistered} />
                <Toaster theme="dark" />
            </>
        );
    }

    // ── Main app ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <main className="flex flex-col flex-1 min-h-0">
                {screen.type === 'chat-list' && (
                    <ChatListScreen
                        currentUserId={userProfile?.id ?? ''}
                        onOpenChat={conv => setScreen({ type: 'chat', conversation: conv })}
                        onNewChat={() => setScreen({ type: 'contacts' })}
                        onNewGroup={() => setScreen({ type: 'create-group' })}
                        onOpenProfile={() => setScreen({ type: 'profile' })}
                    />
                )}

                {screen.type === 'chat' && (
                    <ChatScreen
                        conversation={screen.conversation}
                        currentUserId={userProfile?.id ?? ''}
                        onBack={() => setScreen({ type: 'chat-list' })}
                    />
                )}

                {screen.type === 'contacts' && (
                    <ContactsList
                        onSelectContact={handleSelectContact}
                        onBack={() => setScreen({ type: 'chat-list' })}
                    />
                )}

                {screen.type === 'create-group' && (
                    <CreateGroupScreen
                        onBack={() => setScreen({ type: 'chat-list' })}
                        onGroupCreated={handleGroupCreated}
                    />
                )}

                {screen.type === 'profile' && (
                    <ProfileScreen onBack={() => setScreen({ type: 'chat-list' })} />
                )}
            </main>

            <footer className="flex-shrink-0 py-1.5 text-center text-[10px] text-muted-foreground bg-xeta-panel border-t border-xeta-border">
                Built with ❤️ using{' '}
                <a
                    href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'xeta-app')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-xeta-green"
                >
                    caffeine.ai
                </a>{' '}
                · © {new Date().getFullYear()}
            </footer>

            <Toaster theme="dark" />
        </div>
    );
}
