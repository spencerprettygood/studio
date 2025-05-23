"use client"; // This will be a client-heavy page

import { useState, useEffect, useRef } from 'react';

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
    setInputText('');

    // Simulate AI response for now
    // TODO: Replace with actual Genkit flow call
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: `AI response to: "${userMessage.text}" (This is a placeholder)`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen w-full p-4 md:p-8"> {/* Outer padding */}
      {/* Header (Optional, could be integrated into chat flow) */}
      <header className="mb-4 md:mb-8">
        <h1 className="text-4xl md:text-5xl text-foreground tracking-wider">PromptFlow</h1>
        {/* Asymmetry: Position heading off-center or uniquely */}
      </header>

      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] p-3 rounded-lg text-sm md:text-base
                ${msg.sender === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-card text-card-foreground mr-auto'}
                ${msg.sender === 'user' ? 'rounded-br-none' : 'rounded-bl-none'} 
              `}
              style={{
                 // Example of asymmetric touch: slightly different rounding or offset
                 // This is a placeholder for more sophisticated asymmetric styling
              }}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className="text-xs mt-1 opacity-60 text-right">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      {/* Asymmetry: Input could be positioned non-traditionally, e.g., offset to one side */}
      <form onSubmit={handleSendMessage} className="mt-auto flex items-center w-full md:w-2/3 lg:w-1/2 mx-auto md:ml-[10%]"> {/* Example off-center */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Converse with PromptFlow AI..."
          className="flex-grow p-3 bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded-l-md text-sm md:text-base"
          style={{ borderRight: 'none' }} // Remove border between input and send button
        />
        <button
          type="submit"
          className="p-3 bg-primary text-primary-foreground rounded-r-md hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Send message"
        >
          {/* For now, a simple text button, will evolve to "subtle indicator" */}
          Send
        </button>
      </form>
    </div>
  );
}
