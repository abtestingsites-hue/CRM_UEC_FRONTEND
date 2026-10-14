"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, KanbanSquare, CalendarClock } from 'lucide-react';

export default function AgentLeadsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Lead Pool', href: '/agent/leads/pool', icon: Users },
    { name: 'Conversion Board', href: '/agent/leads/conversion', icon: KanbanSquare },
    { name: 'Follow-ups', href: '/agent/leads/follow-ups', icon: CalendarClock },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      <div className="border-b border-[#222] bg-[#0a0a0a] px-6 py-4 pt-6">
        <div className="flex gap-6">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link 
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 pb-4 -mb-4 px-2 border-b-2 transition-colors ${
                  isActive ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
