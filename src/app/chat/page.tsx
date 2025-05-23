
"use client"; // This will be a client-heavy page

import { useState, useEffect, useRef } from 'react';
import { SendHorizonal } from 'lucide-react'; // Using a Send icon

// Placeholder for chat message type
interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Simulate initial AI greeting
  useEffect(() => {
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: 'Welcome to PromptFlow. How can I assist you with your prompts today?',
        timestamp: new Date(),
      }
    ]);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');

    // Simulate AI response for now
    // TODO: Replace with actual Genkit flow call in subsequent steps
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `AI response to: "${currentInput}" (This is a placeholder for Genkit integration). I can help you process, save, or optimize prompts. Try pasting a block of text or ask me to create a new prompt.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 md:p-6 lg:p-8 bg-background text-foreground font-arimo">
      {/* Header: Asymmetric positioning - e.g. top-left, not centered */}
      <header className="mb-6 md:mb-10 fixed top-4 left-4 md:top-6 md:left-6 lg:top-8 lg:left-8">
        <h1 className="text-3xl md:text-4xl text-foreground font-raleway tracking-wider">
          PromptFlow
        </h1>
      </header>

      {/* Chat Messages Area - Offset to create asymmetry */}
      <div className="flex-grow overflow-y-auto mb-4 pt-20 md:pt-24 lg:pt-28 pr-1 md:pr-2 space-y-4 
                      md:ml-[5%] lg:ml-[10%] md:mr-[2%] lg:mr-[5%]"> {/* Asymmetric margins */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area: Asymmetric positioning - not full width, offset */}
      <form 
        onSubmit={handleSendMessage} 
        className="mt-auto flex items-center w-full sm:w-11/12 md:w-3/4 lg:w-2/3 
                   self-center md:ml-[calc(5%_+_theme(spacing.2))] lg:ml-[calc(10%_+_theme(spacing.4))] mb-2 md:mb-4" // Asymmetric alignment
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Converse with PromptFlow AI..."
          className="flex-grow p-3 md:p-4 bg-input text-foreground placeholder-muted-foreground 
                     focus:outline-none focus:ring-1 focus:ring-accent 
                     rounded-l-md text-sm md:text-base hairline-border border-muted border-r-0"
        />
        <button
          type="submit"
          className="p-3 md:p-4 bg-primary text-primary-foreground rounded-r-md 
                     hover:bg-opacity-80 transition-colors 
                     focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-background focus:ring-accent
                     hairline-border border-accent"
          aria-label="Send message"
        >
          <SendHorizonal size={20} className="md:hidden"/>
          <span className="hidden md:inline text-sm">Send</span>
        </button>
      </form>
    </div>
  );
}
