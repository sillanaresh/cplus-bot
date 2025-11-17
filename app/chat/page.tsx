'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from 'ai/react';
import MessageRenderer from '@/components/MessageRenderer';

export default function ChatPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading } = useChat({
    api: '/api/chat',
    headers: typeof window !== 'undefined' ? {
      'x-connectplus-cookie': sessionStorage.getItem('connectplus_cookie') || '',
      'x-connectplus-org-id': sessionStorage.getItem('connectplus_org_id') || '',
    } : {},
    onError: (error) => {
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('expired')) {
        setSessionExpired(true);
      }
    },
  });

  useEffect(() => {
    const cookie = sessionStorage.getItem('connectplus_cookie');
    const orgId = sessionStorage.getItem('connectplus_org_id');

    if (!cookie || !orgId) {
      router.push('/');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current && chatContainerRef.current) {
      // Scroll to bottom without smooth behavior during streaming to prevent jumping
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleClearChat = () => {
    setMessages([]);
    setSessionExpired(false);
    sessionStorage.removeItem('blocks_cache');
  };

  const handleReauth = () => {
    sessionStorage.removeItem('connectplus_cookie');
    sessionStorage.removeItem('connectplus_org_id');
    sessionStorage.removeItem('blocks_cache');
    router.push('/');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('connectplus_cookie');
    sessionStorage.removeItem('connectplus_org_id');
    sessionStorage.removeItem('blocks_cache');
    router.push('/');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Left Column - Forest Background */}
      <div
        className="w-1/2 border-r border-gray-200"
        style={{
          backgroundImage: 'url(/forest-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      {/* Right Column - Chat Interface */}
      <div className="w-1/2 flex flex-col" style={{ backgroundColor: '#FAF9F7' }}>
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-gray-900">Connect+ Copilot</h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Org: {typeof window !== 'undefined' ? sessionStorage.getItem('connectplus_org_id') : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-scroll
            </label>
            <button
              onClick={handleClearChat}
              className="px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear Chat
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Session Expired Alert */}
        {sessionExpired && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xs font-medium text-amber-900">Session Expired</h3>
                <p className="mt-1 text-xs text-amber-700">
                  Your session has expired. Please provide new credentials to continue.
                </p>
              </div>
              <button
                onClick={handleReauth}
                className="ml-3 px-3 py-1.5 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors"
              >
                Re-authenticate
              </button>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome to Connect+ Copilot
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed" style={{ lineHeight: '1.5' }}>
                  I'm your AI assistant for creating and managing Connect+ data flows.
                  Ask me to help you move data between sources, set up transformations,
                  or manage your dataflows.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`relative max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-900 border border-gray-200'
                }`}
                style={message.role === 'assistant' ? { backgroundColor: '#FAF9F7' } : undefined}
              >
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className={`absolute top-2 right-2 p-1.5 rounded transition-colors ${
                    message.role === 'user'
                      ? 'text-blue-200 hover:text-white hover:bg-blue-700'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Copy message"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <div className="pr-8">
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  ) : (
                    <MessageRenderer content={message.content} onCopy={copyToClipboard} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="border border-gray-200 rounded-lg px-4 py-3" style={{ backgroundColor: '#FAF9F7' }}>
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about Connect+ dataflows..."
              disabled={isLoading || sessionExpired}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || sessionExpired}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
