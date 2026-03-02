import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Paperclip, Loader2, Users, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import { UserAvatar } from './UserAvatar';
import { PresenceIndicator } from './PresenceIndicator';
import {
    useGetMessages,
    useSendMessage,
    useGetContactById,
    useGetCallerUserProfile,
    useMarkMessageAsDelivered,
} from '../hooks/useQueries';
import { MessageType, FileType, ConversationType } from '../backend';
import type { ConversationView, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';
import VoiceCallOverlay from './VoiceCallOverlay';
import VideoCallOverlay from './VideoCallOverlay';

interface ChatScreenProps {
    conversationId: string;
    currentUserId: string;
    otherUser?: UserProfile;
    groupName?: string;
    onBack: () => void;
    // Legacy prop — kept for backward compat when called with full conversation object
    conversation?: ConversationView;
}

export default function ChatScreen({
    conversationId,
    currentUserId,
    otherUser: otherUserProp,
    groupName,
    onBack,
    conversation,
}: ChatScreenProps) {
    const [inputValue, setInputValue] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [showVoiceCall, setShowVoiceCall] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Resolve conversation details — prefer explicit props, fall back to conversation object
    const resolvedConvId = conversationId ?? conversation?.id ?? '';
    const isGroup = conversation
        ? conversation.conversationType === ConversationType.group
        : !otherUserProp && !!groupName;

    const otherUserId = otherUserProp
        ? otherUserProp.id
        : conversation && !isGroup
        ? conversation.participants.find(p => p !== currentUserId) ?? null
        : null;

    const { data: messages = [], isLoading: messagesLoading } = useGetMessages(resolvedConvId);
    const { data: fetchedOtherUser } = useGetContactById(otherUserProp ? null : otherUserId);
    const { data: currentProfile } = useGetCallerUserProfile();
    const sendMessage = useSendMessage(resolvedConvId);
    const markDelivered = useMarkMessageAsDelivered();

    // Resolve the other user — prefer explicit prop, fall back to fetched
    const otherUser = otherUserProp ?? fetchedOtherUser ?? null;

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Mark received messages as delivered
    useEffect(() => {
        messages.forEach(msg => {
            if (msg.senderId !== currentUserId && msg.status === 'sent' as unknown) {
                markDelivered.mutate({ conversationId: resolvedConvId, messageId: msg.id });
            }
        });
    }, [messages, currentUserId, resolvedConvId]);

    const handleSend = useCallback(async () => {
        const content = inputValue.trim();
        if (!content || sendMessage.isPending) return;
        setInputValue('');
        try {
            await sendMessage.mutateAsync({ content, messageType: MessageType.text, mediaFile: null });
        } catch {
            setInputValue(content);
        }
        inputRef.current?.focus();
    }, [inputValue, sendMessage]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        setUploadProgress(0);

        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
                setUploadProgress(pct);
            });

            const mediaFile = {
                media: blob,
                fileType: isImage ? FileType.image : FileType.document_,
            };

            await sendMessage.mutateAsync({
                content: isImage ? '' : file.name,
                messageType: isImage ? MessageType.image : MessageType.file,
                mediaFile,
            });
        } catch {
            // silently fail
        } finally {
            setUploadProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [sendMessage]);

    const headerName = isGroup
        ? (groupName ?? conversation?.name ?? 'Group')
        : (otherUser?.displayName ?? otherUserId ?? 'Chat');

    const headerSub = isGroup
        ? `${conversation?.participants.length ?? 0} participants`
        : null;

    // Suppress unused variable warning
    void currentProfile;

    const senderNames: Record<string, string> = {};

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-foreground hover:bg-xeta-elevated flex-shrink-0"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>

                {isGroup ? (
                    <div className="w-10 h-10 rounded-full bg-xeta-elevated flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-xeta-green" />
                    </div>
                ) : (
                    <UserAvatar
                        displayName={otherUser?.displayName ?? headerName}
                        avatarUrl={otherUser?.avatarUrl}
                        size="md"
                    />
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{headerName}</p>
                    {isGroup ? (
                        <p className="text-xs text-muted-foreground">{headerSub}</p>
                    ) : otherUser ? (
                        <PresenceIndicator lastSeen={otherUser.lastSeen} showDot={false} />
                    ) : null}
                </div>

                {/* Voice & Video call buttons — only for 1-on-1 chats */}
                {!isGroup && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowVoiceCall(true)}
                            className="text-foreground hover:bg-xeta-elevated"
                            title="Voice call"
                        >
                            <Phone className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowVideoCall(true)}
                            className="text-foreground hover:bg-xeta-elevated"
                            title="Video call"
                        >
                            <Video className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Messages — scrollable between sticky header and sticky input */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0"
                style={{ scrollBehavior: 'smooth' }}
            >
                {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-xeta-green" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-xeta-elevated flex items-center justify-center mb-4">
                            <Send className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">No messages yet.</p>
                        <p className="text-muted-foreground text-xs mt-1">Say hello! 👋</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            currentUserId={currentUserId}
                            showSenderName={isGroup}
                            senderName={senderNames[msg.senderId] ?? msg.senderId}
                        />
                    ))
                )}
            </div>

            {/* Upload progress */}
            {uploadProgress !== null && (
                <div className="px-4 py-1 bg-xeta-surface border-t border-xeta-border">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-xeta-elevated rounded-full overflow-hidden">
                            <div
                                className="h-full bg-xeta-green transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                    </div>
                </div>
            )}

            {/* Sticky Input Bar */}
            <div className="sticky bottom-0 z-20 px-3 py-3 bg-xeta-surface border-t border-xeta-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sendMessage.isPending || uploadProgress !== null}
                        className="text-muted-foreground hover:text-xeta-green hover:bg-xeta-elevated flex-shrink-0"
                    >
                        <Paperclip className="w-5 h-5" />
                    </Button>

                    <input
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={sendMessage.isPending}
                        className="flex-1 bg-xeta-elevated border border-xeta-border text-foreground placeholder:text-muted-foreground focus:border-xeta-green focus:outline-none rounded-full px-4 py-2 text-sm transition-colors"
                        maxLength={2000}
                    />

                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sendMessage.isPending}
                        size="icon"
                        className="w-10 h-10 rounded-full bg-xeta-green hover:opacity-90 text-white disabled:opacity-40 flex-shrink-0"
                    >
                        {sendMessage.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Voice Call Overlay */}
            {showVoiceCall && (
                <VoiceCallOverlay
                    contactId={otherUser?.id ?? otherUserId ?? ''}
                    contactName={otherUser?.displayName ?? headerName}
                    onClose={() => setShowVoiceCall(false)}
                />
            )}

            {/* Video Call Overlay */}
            {showVideoCall && (
                <VideoCallOverlay
                    contactId={otherUser?.id ?? otherUserId ?? ''}
                    contactName={otherUser?.displayName ?? headerName}
                    onClose={() => setShowVideoCall(false)}
                />
            )}
        </div>
    );
}
