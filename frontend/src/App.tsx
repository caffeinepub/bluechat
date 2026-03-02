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
import { BottomNavigation, type BottomTab } from './components/BottomNavigation';
import { UpdatesScreen } from './components/UpdatesScreen';
import { CallsScreen } from './components/CallsScreen';
import { XetaAIChatScreen } from './components/XetaAIChatScreen';
import type { ConversationView, UserProfile } from './backend';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

// How long (ms) to wait before showing a timeout/retry UI
const PROFILE_FETCH_TIMEOUT_MS = 15_000;

type Screen =
    | { type: 'chat-list' }
    | { type: 'chat'; conversation: ConversationView }
    | { type: 'contacts' }
    | { type: 'create-group' }
    | { type: 'xeta-ai' };

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
    const [activeTab, setActiveTab] = useState<BottomTab>('chats');

    // Store the newly registered profile locally so we can immediately show
    // the chat list without waiting for the query to refetch.
    const [registeredProfile, setRegisteredProfile] = useState<UserProfile | null>(null);

    // Timeout state: if loading takes too long, show a retry option
    const [timedOut, setTimedOut] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // The effective profile: prefer the query result, fall back to the locally
    // stored registered profile so the app never flickers back to registration.
    const effectiveProfile = userProfile ?? registeredProfile;

    // Start timeout when authenticated but profile not yet fetched
    useEffect(() => {
        if (isAuthenticated && profileLoading && !profileFetched) {
            setTimedOut(false);
            timeoutRef.current = setTimeout(() => {
                setTimedOut(true);
            }, PROFILE_FETCH_TIMEOUT_MS);
        } else {
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

    // Once the query resolves with a real profile, clear the local registered
    // profile cache — the query is now the source of truth.
    useEffect(() => {
        if (userProfile && registeredProfile) {
            setRegisteredProfile(null);
        }
    }, [userProfile, registeredProfile]);

    // Update last seen on mount and periodically
    useEffect(() => {
        if (isAuthenticated && effectiveProfile) {
            updateLastSeen.mutate();
            const interval = setInterval(() => updateLastSeen.mutate(), 60_000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, effectiveProfile]);

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
        setActiveTab('chats');
    }, []);

    const handleLogout = useCallback(async () => {
        await clear();
        queryClient.clear();
        setRegisteredProfile(null);
        setScreen({ type: 'chat-list' });
        setActiveTab('chats');
    }, [clear, queryClient]);

    const handleRetry = useCallback(() => {
        setTimedOut(false);
        refetchProfile();
    }, [refetchProfile]);

    // Called by RegistrationScreen with the newly created profile so we can
    // immediately navigate to the chat list without waiting for a refetch.
    const handleRegistered = useCallback((profile: UserProfile) => {
        setRegisteredProfile(profile);
        setScreen({ type: 'chat-list' });
        setActiveTab('chats');
    }, []);

    const handleTabChange = useCallback((tab: BottomTab) => {
        setActiveTab(tab);
        // When switching to chats tab, go back to chat list
        if (tab === 'chats') {
            setScreen({ type: 'chat-list' });
        }
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
                    </a>
                </footer>
            </div>
        );
    }

    // ── Loading profile ────────────────────────────────────────────────────────
    // Only show the loading screen if we have no profile at all (not even a
    // locally stored registered one) and the query hasn't resolved yet.
    const isLoadingProfile = !effectiveProfile && profileLoading && !profileFetched && !profileError;

    if (isLoadingProfile) {
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
    // Show registration only when the query has resolved and there's truly no profile.
    if (!effectiveProfile && (profileFetched || profileError)) {
        return (
            <>
                <RegistrationScreen onRegistered={handleRegistered} />
                <Toaster theme="dark" />
            </>
        );
    }

    // ── Determine if we're in a full-screen sub-view (no bottom nav) ──────────
    const isSubScreen = screen.type === 'chat' || screen.type === 'contacts' || screen.type === 'create-group' || screen.type === 'xeta-ai';

    // ── Main app ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <main className="flex flex-col flex-1 min-h-0">
                {/* Sub-screens (full screen, no bottom nav) */}
                {screen.type === 'chat' && (
                    <ChatScreen
                        conversation={screen.conversation}
                        currentUserId={effectiveProfile?.id ?? ''}
                        onBack={() => {
                            setScreen({ type: 'chat-list' });
                            setActiveTab('chats');
                        }}
                    />
                )}

                {screen.type === 'contacts' && (
                    <ContactsList
                        onSelectContact={handleSelectContact}
                        onBack={() => {
                            setScreen({ type: 'chat-list' });
                            setActiveTab('chats');
                        }}
                    />
                )}

                {screen.type === 'create-group' && (
                    <CreateGroupScreen
                        onBack={() => {
                            setScreen({ type: 'chat-list' });
                            setActiveTab('chats');
                        }}
                        onGroupCreated={handleGroupCreated}
                    />
                )}

                {screen.type === 'xeta-ai' && (
                    <XetaAIChatScreen
                        onBack={() => {
                            setScreen({ type: 'chat-list' });
                            setActiveTab('chats');
                        }}
                    />
                )}

                {/* Main tab screens (with bottom nav) */}
                {!isSubScreen && (
                    <>
                        {activeTab === 'chats' && (
                            <ChatListScreen
                                currentUserId={effectiveProfile?.id ?? ''}
                                onOpenChat={conv => setScreen({ type: 'chat', conversation: conv })}
                                onNewChat={() => setScreen({ type: 'contacts' })}
                                onNewGroup={() => setScreen({ type: 'create-group' })}
                                onOpenProfile={() => setActiveTab('settings')}
                                onOpenXetaAI={() => setScreen({ type: 'xeta-ai' })}
                            />
                        )}

                        {activeTab === 'updates' && <UpdatesScreen />}

                        {activeTab === 'calls' && <CallsScreen />}

                        {activeTab === 'settings' && (
                            <ProfileScreen
                                onBack={() => {
                                    setActiveTab('chats');
                                    setScreen({ type: 'chat-list' });
                                }}
                            />
                        )}
                    </>
                )}
            </main>

            {/* Bottom navigation — hidden on full-screen sub-screens */}
            {!isSubScreen && (
                <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            )}

            <Toaster theme="dark" />
        </div>
    );
}
