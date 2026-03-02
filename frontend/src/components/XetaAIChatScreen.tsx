import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AIChatMessage {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

interface XetaAIChatScreenProps {
    onBack: () => void;
}

const XETA_AI_RESPONSES = [
    "Hello! I'm Xeta AI, your smart assistant. How can I help you today?",
    "That's a great question! I'm here to assist you with anything you need on Xeta.",
    "I understand. Let me help you with that. Feel free to ask me anything!",
    "Xeta is a secure, fast messaging platform built on the Internet Computer. Is there anything specific you'd like to know?",
    "I'm always here to help! You can ask me about features, tips, or just have a conversation.",
    "Great to hear from you! Xeta keeps your messages secure and private. Anything else I can help with?",
    "That's interesting! I'm continuously learning to better assist Xeta users like you.",
    "Sure thing! Remember, you can start new chats, create groups, and manage your profile from the main screen.",
    "I'm Xeta AI — your personal assistant on this platform. What would you like to explore today?",
    "Thanks for reaching out! If you have any questions about Xeta or need help, I'm right here.",
];

const KEYWORD_RESPONSES: { keywords: string[]; response: string }[] = [
    {
        keywords: ['hello', 'hi', 'hey', 'greetings'],
        response: "Hello there! 👋 Welcome to Xeta AI. How can I assist you today?",
    },
    {
        keywords: ['help', 'support', 'assist'],
        response: "I'm here to help! You can ask me about Xeta features, how to start a chat, create groups, or anything else you need.",
    },
    {
        keywords: ['chat', 'message', 'conversation'],
        response: "To start a new chat, tap the compose icon on the Chats screen. You can search for users by their username and start a one-on-one conversation instantly!",
    },
    {
        keywords: ['group', 'groups'],
        response: "Creating a group on Xeta is easy! Tap the compose icon on the Chats screen, then select 'New Group'. Add participants and give your group a name.",
    },
    {
        keywords: ['profile', 'name', 'username', 'account'],
        response: "You can update your profile by tapping the Settings tab at the bottom. There you can change your display name and status message.",
    },
    {
        keywords: ['secure', 'privacy', 'safe', 'security'],
        response: "Xeta is built on the Internet Computer blockchain, providing strong security and privacy for all your messages and data. Your identity is protected by Internet Identity.",
    },
    {
        keywords: ['internet', 'identity', 'login', 'auth'],
        response: "Xeta uses Internet Identity for authentication — a secure, passwordless login system. No passwords to remember, no data leaks!",
    },
    {
        keywords: ['status', 'updates', 'stories'],
        response: "The Updates tab will soon let you share status updates and stories with your contacts. Stay tuned for this exciting feature!",
    },
    {
        keywords: ['call', 'calls', 'voice', 'video'],
        response: "Voice and video calling is coming soon to Xeta! Check the Calls tab for updates when this feature launches.",
    },
    {
        keywords: ['bye', 'goodbye', 'see you', 'later'],
        response: "Goodbye! 👋 Feel free to come back anytime you need help. Have a great day!",
    },
    {
        keywords: ['thanks', 'thank you', 'thx'],
        response: "You're welcome! 😊 I'm always here if you need anything else.",
    },
    {
        keywords: ['xeta', 'app', 'platform'],
        response: "Xeta is a modern messaging platform built on the Internet Computer. It offers secure messaging, group chats, and more — all powered by blockchain technology!",
    },
];

function getAIResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    for (const { keywords, response } of KEYWORD_RESPONSES) {
        if (keywords.some(kw => lower.includes(kw))) {
            return response;
        }
    }
    // Fallback to rotating responses
    const idx = Math.floor(Math.random() * XETA_AI_RESPONSES.length);
    return XETA_AI_RESPONSES[idx];
}

const STORAGE_KEY = 'xeta-ai-chat-history';

function loadHistory(): AIChatMessage[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Array<{ id: string; role: 'user' | 'ai'; content: string; timestamp: string }>;
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

function saveHistory(messages: AIChatMessage[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
    } catch {
        // ignore storage errors
    }
}

export function XetaAIChatScreen({ onBack }: XetaAIChatScreenProps) {
    const [messages, setMessages] = useState<AIChatMessage[]>(() => {
        const history = loadHistory();
        if (history.length === 0) {
            return [
                {
                    id: 'welcome',
                    role: 'ai',
                    content: "Hi! I'm Xeta AI 🤖 Your intelligent assistant on Xeta. Ask me anything about the app, or just say hello!",
                    timestamp: new Date(),
                },
            ];
        }
        return history;
    });
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        saveHistory(messages);
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isTyping) return;

        const userMsg: AIChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI thinking delay
        const delay = 600 + Math.random() * 800;
        setTimeout(() => {
            const aiMsg: AIChatMessage = {
                id: `ai-${Date.now()}`,
                role: 'ai',
                content: getAIResponse(text),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, delay);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-xeta-surface border-b border-xeta-border flex-shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-foreground hover:bg-xeta-elevated"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-xeta-green to-xeta-green-dim flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-xeta-panel" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Xeta AI</p>
                    <p className="text-xs text-xeta-green">Always online</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
                {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                    >
                        {msg.role === 'ai' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-xeta-green to-xeta-green-dim flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1">
                                <Bot className="w-3.5 h-3.5 text-xeta-panel" />
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] rounded-bubble px-3 py-2 ${
                                msg.role === 'user'
                                    ? 'bg-sent-bubble text-white rounded-br-bubble-sm'
                                    : 'bg-xeta-elevated text-foreground rounded-bl-bubble-sm'
                            }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                                {formatTime(msg.timestamp)}
                            </p>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start animate-fade-in-up">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-xeta-green to-xeta-green-dim flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1">
                            <Bot className="w-3.5 h-3.5 text-xeta-panel" />
                        </div>
                        <div className="bg-xeta-elevated rounded-bubble rounded-bl-bubble-sm px-4 py-3 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-xeta-green animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-xeta-green animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-xeta-green animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 bg-xeta-surface border-t border-xeta-border flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Xeta AI..."
                    className="flex-1 bg-xeta-elevated border-xeta-border text-foreground placeholder:text-muted-foreground focus-visible:ring-xeta-green rounded-full px-4"
                    disabled={isTyping}
                />
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className="rounded-full bg-xeta-green hover:bg-xeta-green-bright text-xeta-panel flex-shrink-0 disabled:opacity-40"
                >
                    {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
