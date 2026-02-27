import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Message } from '../backend';

export function useGetMessages(conversationId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<Message[]>({
        queryKey: ['messages', conversationId],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getMessages(conversationId);
        },
        enabled: !!actor && !isFetching && !!conversationId,
        refetchInterval: 3000, // Poll every 3 seconds for new messages
    });
}

export function usePostMessage(conversationId: string) {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (content: string) => {
            if (!actor) throw new Error('Actor not initialized');
            await actor.postMessage(conversationId, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}

export function useClearConversation(conversationId: string) {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not initialized');
            await actor.clearConversation(conversationId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        },
    });
}
