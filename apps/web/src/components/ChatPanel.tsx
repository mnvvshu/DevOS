import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Wrench, CheckCircle2, XCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useApi } from '../hooks/useApi';
import { ApprovalDialog } from './ApprovalDialog';
import type { WSEvent } from '@devos/shared';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{
    name: string;
    input: unknown;
    success: boolean;
    durationMs: number;
  }>;
  durationMs?: number;
  timestamp: Date;
}

interface ChatPanelProps {
  projectPath: string | null;
  wsEvents: WSEvent[];
  wsConnected: boolean;
}

export function ChatPanel({ projectPath, wsEvents, wsConnected }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [approvalRequest, setApprovalRequest] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const api = useApi();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus]);

  // Track agent events from WebSocket
  useEffect(() => {
    const latestEvent = wsEvents[wsEvents.length - 1];
    if (!latestEvent) return;

    switch (latestEvent.type) {
      case 'agent:thinking':
        setAgentStatus('Thinking...');
        break;
      case 'agent:tool_call': {
        const data = latestEvent.data as { toolName: string };
        setAgentStatus(`Running tool: ${data.toolName}`);
        break;
      }
      case 'agent:tool_result':
        setAgentStatus('Analyzing results...');
        break;
      case 'approval:request':
        setApprovalRequest(latestEvent.data);
        break;
      case 'agent:complete':
        setAgentStatus(null);
        break;
      case 'agent:error':
        setAgentStatus(null);
        break;
    }
  }, [wsEvents]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setAgentStatus('Processing...');

    try {
      const result = await api.chat(trimmed, projectPath, sessionId || undefined);
      setSessionId(result.sessionId);

      const assistantMessage: Message = {
        id: result.taskId,
        role: 'assistant',
        content: result.response,
        toolCalls: result.toolCalls,
        durationMs: result.durationMs,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setAgentStatus(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}

        {/* Agent status */}
        {agentStatus && (
          <div className="max-w-3xl mx-auto mt-4">
            <div className="flex items-center gap-2 text-sm text-devos-text-secondary">
              <Loader2 size={16} className="animate-spin" />
              {agentStatus}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-devos-border p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-devos-surface border border-devos-border rounded-xl px-4 py-3 focus-within:border-devos-accent transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={projectPath ? 'Ask about your project...' : 'Open a project to get started, or ask a general question...'}
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[24px] max-h-[200px] placeholder-devos-text-secondary"
              style={{ height: 'auto', overflowY: input.split('\n').length > 5 ? 'auto' : 'hidden' }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-devos-accent text-white hover:bg-devos-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-xs text-devos-text-secondary">
              {wsConnected ? (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-devos-success" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-devos-error" />
                  Disconnected
                </span>
              )}
            </span>
            <span className="text-xs text-devos-text-secondary">Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </div>

      {/* Approval dialog */}
      {approvalRequest && (
        <ApprovalDialog
          request={approvalRequest}
          onDecision={(_decision) => {
            // Send decision via WebSocket
            setApprovalRequest(null);
          }}
        />
      )}
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-devos-accent">Dev</span>OS
        </h2>
        <p className="text-devos-text-secondary mb-6">
          Your local AI developer assistant. Open a project and ask questions about your codebase,
          diagnose problems, or let me help fix bugs.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            'Why are my tests failing?',
            'Explain the project architecture',
            'Find performance bottlenecks',
            'Show me recent Git changes',
          ].map((suggestion, i) => (
            <button
              key={i}
              className="p-3 text-left rounded-lg border border-devos-border hover:border-devos-accent hover:bg-devos-surface-hover transition-colors text-devos-text-secondary hover:text-devos-text"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-devos-accent/10 flex items-center justify-center shrink-0">
          <Bot size={18} className="text-devos-accent" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-devos-accent text-white ml-auto'
            : 'bg-devos-surface border border-devos-border'
        }`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tc, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-devos-text-secondary">
                <Wrench size={12} />
                <span className="font-mono">{tc.name}</span>
                {tc.success ? (
                  <CheckCircle2 size={12} className="text-devos-success" />
                ) : (
                  <XCircle size={12} className="text-devos-error" />
                )}
                <span>{tc.durationMs}ms</span>
              </div>
            ))}
          </div>
        )}

        {/* Duration */}
        {message.durationMs && (
          <div className="flex items-center gap-1 mt-1 text-xs text-devos-text-secondary">
            <Clock size={11} />
            {(message.durationMs / 1000).toFixed(1)}s
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-devos-surface border border-devos-border flex items-center justify-center shrink-0">
          <User size={18} className="text-devos-text-secondary" />
        </div>
      )}
    </div>
  );
}
