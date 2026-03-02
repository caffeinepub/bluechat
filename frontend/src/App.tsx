import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useUpdateLastSeen, useCreateOneOnOneConversation } from './hooks/useQueries';
import { RegistrationScreen } from './components/RegistrationScreen';
import { ChatListScreen } from './components/ChatListScreen';
import ChatScreen from './components/ChatScreen';
import { ContactsList } from './components/ContactsList';
import { CreateGroupScreen } from './components/CreateGroupScreen';
import ProfileScreen from './components/ProfileScreen';
import { BottomNavigation, type BottomTab } from './components/BottomNavigation';
import UpdatesScreen from './components/UpdatesScreen';
import CallsScreen from './components/CallsScreen';
import type { ConversationView, UserProfile } from './backend';
import { Loader2, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { initTheme } from './hooks/useTheme';

// Apply persisted theme before first render
initTheme();

const PROFILE_FETCH_TIMEOUT_MS = 15_000;

type Screen =
    | { type: 'chat-list' }
    | { type: 'chat'; conversation: ConversationView }
    | { type: 'contacts' }
    | { type: 'create-group' };

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
    const [registeredProfile, setRegisteredProfile] = useState<UserProfile | null>(null);
    const [timedOut, setTimedOut] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const effectiveProfile = userProfile ?? registeredProfile;

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

    useEffect(() => {
        if (userProfile && registeredProfile) {
            setRegisteredProfile(null);
        }
    }, [userProfile, registeredProfile]);

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

    const handleRegistered = useCallback((profile: UserProfile) => {
        setRegisteredProfile(profile);
        setScreen({ type: 'chat-list' });
        setActiveTab('chats');
    }, []);

    const handleTabChange = useCallback((tab: BottomTab) => {
        setActiveTab(tab);
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
                        className="w-full flex items-center justify-center gap-2 bg-xeta-green hover:opacity-90 text-white font-semibold rounded-full py-3 px-6 transition-opacity disabled:opacity-60"
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
            </div>
        );
    }

    // ── Loading profile ────────────────────────────────────────────────────────
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
                        className="flex items-center gap-2 bg-xeta-green hover:opacity-90 text-white font-semibold rounded-full py-2 px-5 transition-opacity text-sm"
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
    if (!effectiveProfile && (profileFetched || profileError)) {
        return (
            <>
                <RegistrationScreen onRegistered={handleRegistered} />
                <Toaster />
            </>
        );
    }

    const isSubScreen = screen.type === 'chat' || screen.type === 'contacts' || screen.type === 'create-group';

    // ── Main app ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            <main className="flex flex-col flex-1 min-h-0">
                {/* Sub-screens (full screen, no bottom nav) */}
                {screen.type === 'chat' && (
                    <ChatScreen
                        conversationId={screen.conversation.id}
                        currentUserId={effectiveProfile?.id ?? ''}
                        otherUser={
                            screen.conversation.participants.find(p => p !== effectiveProfile?.id)
                                ? undefined
                                : undefined
                        }
                        groupName={
                            screen.conversation.conversationType === 'group' as unknown
                                ? screen.conversation.name
                                : undefined
                        }
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

            {!isSubScreen && (
                <div className={activeTab === 'chats' ? 'sticky bottom-0 z-10' : ''}>
                    <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                </div>
            )}

            <Toaster />
        </div>
    );
}
