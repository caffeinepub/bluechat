import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Message, UserProfile, ConversationView, MediaFile } from '../backend';
import { MessageType } from '../backend';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery<UserProfile | null>({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            try {
                return await actor.getCallerUserProfile();
            } catch (err: unknown) {
                // A new user has no role yet — the backend traps with "Unauthorized".
                // Treat this as "no profile" so the registration screen is shown.
                const msg = err instanceof Error ? err.message : String(err);
                if (
                    msg.includes('Unauthorized') ||
                    msg.includes('not registered') ||
                    msg.includes('User not registered')
                ) {
                    return null;
                }
                throw err;
            }
        },
        enabled: !!actor && !actorFetching,
        retry: false,
        // Don't cache stale data across identity changes
        staleTime: 0,
    });

    return {
        ...query,
        isLoading: actorFetching || query.isLoading,
        isFetched: !!actor && !actorFetching && query.isFetched,
    };
}

export function useCreateUser() {
    const { actor, isFetching: actorFetching } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ username, displayName }: { username: string; displayName: string }) => {
            // Guard: ensure actor is fully initialized before proceeding
            if (actorFetching) {
                throw new Error('Connection not ready. Please wait a moment and try again.');
            }
            if (!actor) {
                throw new Error('Connection not ready. Please try again.');
            }

            let result;
            try {
                result = await actor.createUser(username, displayName);
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                // Surface transient connection errors with a friendly message
                if (
                    msg.includes('fetch') ||
                    msg.includes('network') ||
                    msg.includes('timeout') ||
                    msg.includes('Failed to fetch') ||
                    msg.toLowerCase().includes('connection')
                ) {
                    throw new Error('Connection not ready. Please try again.');
                }
                throw err;
            }

            // Inspect the discriminated union — throw on error so the component's
            // catch block receives a proper Error with the backend message.
            if (result.__kind__ === 'authenticationError') {
                throw new Error(result.authenticationError);
            }
            if (result.__kind__ === 'usernameTaken') {
                // Use a special prefix so RegistrationScreen can detect it
                throw new Error('USERNAME_TAKEN:' + result.usernameTaken);
            }
            // result.__kind__ === 'userProfile'
            return result.userProfile;
        },
        onSuccess: (profile) => {
            // Immediately populate the cache with the new profile so App.tsx
            // transitions to the chat list without waiting for a refetch.
            queryClient.setQueryData(['currentUserProfile'], profile);
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

export function useSaveCallerUserProfile() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: UserProfile) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

export function useGetUserProfile(userId: string | null) {
    const { actor, isFetching } = useActor();

    return useQuery<UserProfile | null>({
        queryKey: ['userProfile', userId],
        queryFn: async () => {
            if (!actor || !userId) return null;
            return actor.getUserProfile(userId);
        },
        enabled: !!actor && !isFetching && !!userId,
        staleTime: 30_000,
    });
}

export function useGetContactById(userId: string | null) {
    const { actor, isFetching } = useActor();

    return useQuery<UserProfile | null>({
        queryKey: ['contact', userId],
        queryFn: async () => {
            if (!actor || !userId) return null;
            return actor.getContactById(userId);
        },
        enabled: !!actor && !isFetching && !!userId,
        staleTime: 30_000,
    });
}

export function useGetAllUsers() {
    const { actor, isFetching } = useActor();

    return useQuery<UserProfile[]>({
        queryKey: ['allUsers'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllUsers();
        },
        enabled: !!actor && !isFetching,
        staleTime: 30_000,
    });
}

// ─── Conversations ────────────────────────────────────────────────────────────

export function useGetMyConversations() {
    const { actor, isFetching } = useActor();

    return useQuery<ConversationView[]>({
        queryKey: ['myConversations'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getMyConversations();
        },
        enabled: !!actor && !isFetching,
        refetchInterval: 5000,
    });
}

export function useGetConversation(conversationId: string | null) {
    const { actor, isFetching } = useActor();

    return useQuery<ConversationView | null>({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
            if (!actor || !conversationId) return null;
            return actor.getConversation(conversationId);
        },
        enabled: !!actor && !isFetching && !!conversationId,
        refetchInterval: 5000,
    });
}

export function useCreateOneOnOneConversation() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (otherUserId: string) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createOneOnOneConversation(otherUserId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myConversations'] });
        },
    });
}

export function useCreateGroupChat() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ participants, groupName }: { participants: string[]; groupName: string }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createGroupChat(participants, groupName);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myConversations'] });
        },
    });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useGetMessages(conversationId: string | null) {
    const { actor, isFetching } = useActor();

    return useQuery<Message[]>({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!actor || !conversationId) return [];
            return actor.getMessages(conversationId, BigInt(0), BigInt(200));
        },
        enabled: !!actor && !isFetching && !!conversationId,
        refetchInterval: 3000,
    });
}

export function useSendMessage(conversationId: string | null) {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            content,
            messageType,
            mediaFile,
        }: {
            content: string;
            messageType: MessageType;
            mediaFile: MediaFile | null;
        }) => {
            if (!actor || !conversationId) throw new Error('Actor not initialized');
            return actor.sendMessage(conversationId, content, messageType, mediaFile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['myConversations'] });
        },
    });
}

export function useMarkMessageAsRead() {
    const { actor } = useActor();

    return useMutation({
        mutationFn: async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.markMessageAsRead(conversationId, messageId);
        },
    });
}

export function useMarkMessageAsDelivered() {
    const { actor } = useActor();

    return useMutation({
        mutationFn: async ({ conversationId, messageId }: { conversationId: string; messageId: string }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.markMessageAsDelivered(conversationId, messageId);
        },
    });
}

// ─── Presence ─────────────────────────────────────────────────────────────────

export function useUpdateLastSeen() {
    const { actor } = useActor();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.updateLastSeen();
        },
    });
}
