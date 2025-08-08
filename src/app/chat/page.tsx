
"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { conversationalChat, type ConversationalChatOutput } from '@/ai/flows/conversational-chat-flow';
import { Loader2, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isFresh?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm roFl. Your AI prompt engineering partner. What are we creating today?",
        isFresh: true,
      }
    ]);
  }, []);
  
  useEffect(() => {
    // Focus input when the page loads or after an AI response
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const result: ConversationalChatOutput = await conversationalChat({ userInput: currentInput });
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.aiResponse,
        isFresh: true,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in conversational chat:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "My circuits seem to be crossed. Please try that again in a moment.",
        isFresh: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const latestAiMessage = messages.filter(m => m.role === 'assistant').pop();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full text-foreground p-4">
      <main className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow transition-all duration-300 ease-in-out">
        
        {/* Display the latest AI message */}
        <div 
          key={latestAiMessage?.id} 
          className="text-center text-2xl md:text-4xl font-light text-foreground/90 leading-tight mb-8 animate-fadeIn"
          onAnimationEnd={() => {
            if (latestAiMessage) {
              latestAiMessage.isFresh = false;
            }
          }}
        >
          {latestAiMessage?.content}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full relative mt-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "roFl is thinking..." : "Type here..."}
            className="w-full bg-transparent text-2xl md:text-4xl text-center placeholder:text-muted-foreground/50 focus:outline-none py-2 font-light"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ArrowRight className="h-6 w-6" />}
          </button>
        </form>

      </main>
    </div>
  );
}
