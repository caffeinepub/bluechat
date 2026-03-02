import React from 'react';
import { MessageSquare, Circle, Phone, Settings } from 'lucide-react';

export type BottomTab = 'chats' | 'updates' | 'calls' | 'settings';

interface BottomNavigationProps {
    activeTab: BottomTab;
    onTabChange: (tab: BottomTab) => void;
}

const tabs: { id: BottomTab; label: string; Icon: React.ElementType }[] = [
    { id: 'chats', label: 'Chats', Icon: MessageSquare },
    { id: 'updates', label: 'Updates', Icon: Circle },
    { id: 'calls', label: 'Calls', Icon: Phone },
    { id: 'settings', label: 'Settings', Icon: Settings },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
    return (
        <nav className="flex-shrink-0 flex items-stretch bg-xeta-surface border-t border-xeta-border">
            {tabs.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                            isActive
                                ? 'text-xeta-green'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon
                            className={`w-5 h-5 ${isActive ? 'fill-xeta-green/20 stroke-xeta-green' : ''}`}
                            strokeWidth={isActive ? 2.5 : 1.8}
                        />
                        <span
                            className={`text-[10px] font-medium leading-none ${
                                isActive ? 'text-xeta-green' : 'text-muted-foreground'
                            }`}
                        >
                            {label}
                        </span>
                        {isActive && (
                            <span className="absolute bottom-0 w-8 h-0.5 bg-xeta-green rounded-full" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
