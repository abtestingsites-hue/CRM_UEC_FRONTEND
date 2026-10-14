"use client";

import React from 'react';
import { useConversationStore } from '@/store/conversationStore';
import { ConversationSidebar } from '@/components/omnichannel/ConversationSidebar';
import { ConversationThread } from '@/components/omnichannel/ConversationThread';
import { Customer360Panel } from '@/components/omnichannel/Customer360Panel';

export default function AgentOmnichannel() {
  const { activeConversationId } = useConversationStore();

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#000]">
      {/* Inbox List: Hidden on mobile if a conversation is open */}
      <div className={`w-full md:w-80 border-r border-[#222] flex-col bg-[#050505] shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <ConversationSidebar />
      </div>

      {/* Chat Window: Hidden on mobile if NO conversation is open */}
      <div className={`flex-1 flex-col min-w-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <ConversationThread />
      </div>

      {/* Customer Panel: Hidden on mobile, visible on large screens */}
      <div className="hidden lg:flex flex-col w-[350px] border-l border-[#222] bg-[#050505] shrink-0">
        <Customer360Panel />
      </div>
    </div>
  );
}
