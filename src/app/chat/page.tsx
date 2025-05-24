
"use client"; // This will be a client-heavy page

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react'; // Using Loader icon
import { conversationalChat } from '@/ai/flows/conversational-chat-flow';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isFresh?: boolean; // For animation
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Initial AI greeting
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Welcome to roFl! I'm your assistant for managing, organizing, and optimizing prompts. Paste a bunch of prompts, ask me questions, or tell me what you need!",
        timestamp: new Date(),
        isFresh: true,
      }
    ]);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoadingAI) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputText,
      timestamp: new Date(),
      isFresh: true,
    };
    setMessages(prev => [...prev.map(m => ({...m, isFresh: false})), userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoadingAI(true);

    try {
      const response = await conversationalChat({ userInput: currentInput });
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: response.aiResponse,
        timestamp: new Date(),
        isFresh: true,
      };
      setMessages(prev => [...prev.map(m => ({...m, isFresh: false})), aiResponse]);
    } catch (error) {
      console.error("Error calling conversationalChat flow:", error);
      const errorResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        isFresh: true,
      };
      setMessages(prev => [...prev.map(m => ({...m, isFresh: false})), errorResponse]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 md:p-6 lg:p-8 bg-background text-foreground font-arimo relative">
      {/* Top decorative line */}
      <div className="absolute top-4 left-0 right-0 mx-auto w-11/12 h-[0.5px] bg-muted opacity-50"></div>

      {/* Header: Asymmetric positioning */}
      <header className="mb-6 md:mb-10 fixed top-8 left-4 md:top-10 md:left-6 lg:top-12 lg:left-8 z-10">
        <h1 className="text-3xl md:text-4xl text-foreground font-raleway tracking-wider italic font-semibold">
          roFl
        </h1>
      </header>

      {/* Chat Messages Area - Offset to create asymmetry */}
      <div className="flex-grow overflow-y-auto mb-4 pt-24 md:pt-28 lg:pt-32 pr-1 md:pr-2 space-y-4 
                      md:ml-[5%] lg:ml-[10%] md:mr-[2%] lg:mr-[5%]"> {/* Asymmetric margins */}
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${msg.isFresh ? 'animate-fadeIn' : ''}`}
            onAnimationEnd={() => setMessages(prev => prev.map(m => m.id === msg.id ? {...m, isFresh: false} : m))}
          >
            <div
              className={`max-w-[75%] md:max-w-[65%] p-3 md:p-4 shadow-md
                ${msg.sender === 'user' ? 'bg-secondary text-primary-foreground ml-auto rounded-lg rounded-br-none' : 'bg-card text-card-foreground mr-auto rounded-lg rounded-bl-none'}
              `}
            >
              <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.text}</p>
              <p className="text-xs mt-2 opacity-70 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoadingAI && (
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[75%] md:max-w-[65%] p-3 md:p-4 shadow-md bg-card text-card-foreground mr-auto rounded-lg rounded-bl-none flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2 text-accent" />
              <p className="text-sm md:text-base text-muted-foreground italic">AI is thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area: Asymmetric positioning */}
      <form 
        onSubmit={handleSendMessage} 
        className="mt-auto flex items-center w-full sm:w-11/12 md:w-3/4 lg:w-2/3 
                   self-center md:ml-[calc(5%_+_theme(spacing.2))] lg:ml-[calc(10%_+_theme(spacing.4))] mb-2 md:mb-4" // Asymmetric alignment
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Converse with roFl..."
          className="flex-grow p-3 md:p-4 bg-input text-foreground placeholder-muted-foreground 
                     focus:outline-none focus:ring-1 focus:ring-accent 
                     rounded-l-md text-sm md:text-base hairline-border border-muted border-r-0"
          disabled={isLoadingAI}
        />
        <button
          type="submit"
          className="p-3 md:p-4 bg-primary text-primary-foreground rounded-r-md 
                     hover:bg-opacity-80 transition-colors 
                     focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-background focus:ring-accent
                     hairline-border border-accent flex items-center justify-center"
          aria-label="Send message"
          disabled={isLoadingAI}
        >
          {isLoadingAI ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <span className="text-sm font-medium">Send</span>
          )}
        </button>
      </form>
    </div>
  );
}
