import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Bluetooth, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { BluetoothMessage } from '../hooks/useBluetooth';
import { usePostMessage, useClearConversation } from '../hooks/useQueries';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatInterfaceProps {
    deviceName: string | null;
    messages: BluetoothMessage[];
    conversationId: string;
    onSendMessage: (content: string) => Promise<boolean>;
    onClearMessages: () => void;
}

export function ChatInterface({
    deviceName,
    messages,
    conversationId,
    onSendMessage,
    onClearMessages,
}: ChatInterfaceProps) {
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const postMessage = usePostMessage(conversationId);
    const clearConversation = useClearConversation(conversationId);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = useCallback(async () => {
        const content = inputValue.trim();
        if (!content || isSending) return;

        setIsSending(true);
        setInputValue('');

        try {
            // Send over Bluetooth
            const btSuccess = await onSendMessage(content);

            // Also persist to backend
            if (btSuccess) {
                postMessage.mutate(content);
            }
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }, [inputValue, isSending, onSendMessage, postMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    const handleClearAll = useCallback(async () => {
        clearConversation.mutate();
        onClearMessages();
    }, [clearConversation, onClearMessages]);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 bg-navy-surface border-b border-navy-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-muted/30 border border-cyan-glow/40 flex items-center justify-center">
                        <Bluetooth className="w-4 h-4 text-cyan-glow" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {deviceName || 'Connected Device'}
                        </p>
                        <p className="text-xs text-cyan-glow font-mono">● Active</p>
                    </div>
                </div>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Clear conversation"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-navy-surface border-navy-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Clear Conversation?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                                This will permanently delete all messages in this conversation. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-navy-elevated border-navy-border text-foreground hover:bg-navy-border">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleClearAll}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Clear All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Messages area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
                style={{ scrollBehavior: 'smooth' }}
            >
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-navy-surface border border-navy-border flex items-center justify-center mb-4">
                            <Bluetooth className="w-8 h-8 text-cyan-dim" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            No messages yet. Say hello! 👋
                        </p>
                        <p className="text-muted-foreground text-xs mt-1 font-mono">
                            Messages are sent directly over Bluetooth
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            deviceName={deviceName}
                        />
                    ))
                )}
            </div>

            {/* Input area */}
            <div className="px-4 py-3 bg-navy-surface border-t border-navy-border">
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        disabled={isSending}
                        className="flex-1 bg-navy-elevated border-navy-border text-foreground placeholder:text-muted-foreground focus-visible:ring-cyan-glow focus-visible:border-cyan-glow/50 rounded-full px-4"
                        maxLength={500}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        size="icon"
                        className="w-10 h-10 rounded-full bg-cyan-glow text-navy-deep hover:bg-cyan-bright disabled:opacity-40 flex-shrink-0 transition-all duration-200"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1.5 text-center opacity-50">
                    Press Enter to send · Bluetooth only · No internet required
                </p>
            </div>
        </div>
    );
}
