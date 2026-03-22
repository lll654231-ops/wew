/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Loader2, Sparkles, Trash2, Github } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are "Wio" (ويو), a highly intelligent and friendly AI assistant. 
Your name is Wio. You should be helpful, creative, and polite. 
You can speak both Arabic and English fluently. 
When asked who you are, always identify as Wio.`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3.1-pro-preview",
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const result = await chat.sendMessageStream({ message: userMessage });
      
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: 'Sorry, I encountered an error. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              Wio AI <span className="text-emerald-400 font-arabic ml-1">ويو</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Powered by Gemini 3.1 Pro</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-500 hover:text-zinc-300"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-4xl mx-auto w-full scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
              <Bot className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-light tracking-tight text-white">
              How can I help you today?
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
              I'm Wio, your intelligent assistant. Ask me anything, from coding to creative writing.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
              {[
                "Write a poem about the stars",
                "Explain quantum physics simply",
                "Help me write a React component",
                "Translate 'Hello' to Arabic"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    // We don't auto-send to give user a chance to edit
                  }}
                  className="p-4 text-sm text-left rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-zinc-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={cn(
                "flex gap-4 animate-in slide-in-from-bottom-4 duration-300",
                message.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                message.role === 'user' ? "bg-zinc-800" : "bg-emerald-500/20 text-emerald-400"
              )}>
                {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={cn(
                "max-w-[85%] px-5 py-3 rounded-2xl leading-relaxed",
                message.role === 'user' 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white/5 text-zinc-200 rounded-tl-none border border-white/5"
              )}>
                <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
            <div className="bg-white/5 px-5 py-3 rounded-2xl rounded-tl-none border border-white/5 w-12 h-10 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-gradient-to-t from-black to-transparent">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message Wio..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none min-h-[60px] max-h-[200px] placeholder:text-zinc-600"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "absolute right-3 bottom-3 p-2.5 rounded-xl transition-all",
              input.trim() && !isLoading 
                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20" 
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-center text-zinc-600 mt-4 uppercase tracking-widest font-medium">
          Wio may display inaccurate info, including about people, so double-check its responses.
        </p>
      </footer>
    </div>
  );
}
