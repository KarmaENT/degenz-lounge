import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useSandbox, SandboxAgent, ChatMessage } from '@/lib/sandbox';
import { useAgents, Agent } from '@/lib/agents';
import { useRouter } from 'next/router';
import Link from 'next/link';

const SandboxDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    currentSession, 
    setCurrentSession, 
    sessionAgents, 
    messages, 
    fetchSessions, 
    fetchSessionAgents, 
    fetchMessages, 
    addAgentToSession, 
    removeAgentFromSession, 
    updateAgentPosition, 
    sendMessage 
  } = useSandbox();
  
  const { agents, fetchAgents } = useAgents();
  
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedAgentPosition, setSelectedAgentPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchSessions(),
        fetchAgents()
      ]);
      setIsLoading(false);
    };

    if (id) {
      loadData();
    }
  }, [id, fetchSessions, fetchAgents]);

  useEffect(() => {
    if (id && currentSession?.id !== id) {
      const session = currentSession?.id === id ? 
        currentSession : 
        { id: id as string, name: '', configuration: {}, user_id: '', created_at: '', updated_at: '' };
      
      setCurrentSession(session);
      fetchSessionAgents(id as string);
      fetchMessages(id as string);
    }
  }, [id, currentSession, setCurrentSession, fetchSessionAgents, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !id) return;

    try {
      await sendMessage(id as string, messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleAddAgent = async (agentId: string) => {
    if (!id) return;
    
    try {
      await addAgentToSession(id as string, {
        agent_id: agentId,
        position_x: selectedAgentPosition.x,
        position_y: selectedAgentPosition.y,
        configuration: {}
      });
      setShowAgentSelector(false);
    } catch (err) {
      console.error('Error adding agent:', err);
    }
  };

  const handleRemoveAgent = async (agentId: string) => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to remove this agent from the sandbox?')) {
      try {
        await removeAgentFromSession(id as string, agentId);
      } catch (err) {
        console.error('Error removing agent:', err);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showAgentSelector) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      
      setSelectedAgentPosition({ x, y });
      setShowAgentSelector(true);
    } else {
      setShowAgentSelector(false);
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, agentId: string, currentX: number, currentY: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(agentId);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !id) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 100, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(rect.height - 100, e.clientY - rect.top - dragOffset.y));
    
    const agent = sessionAgents.find(a => a.id === isDragging);
    if (agent) {
      updateAgentPosition(id as string, isDragging, { position_x: x, position_y: y });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  if (isLoading) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading sandbox...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentSession) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            Sandbox session not found
          </div>
          <Link href="/sandbox" className="text-primary hover:text-primary/90">
            &larr; Back to Sandbox
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <Link href="/sandbox" className="text-primary hover:text-primary/90">
            &larr; Back to Sandbox
          </Link>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{currentSession.name}</h1>
            <p className="text-text-secondary mt-2">
              {currentSession.configuration?.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Agent Sandbox</h2>
              <div 
                className="bg-background rounded-md h-96 relative overflow-hidden"
                onClick={handleCanvasClick}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                {sessionAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="absolute w-24 h-24 bg-surface rounded-md shadow-md flex flex-col items-center justify-center cursor-move"
                    style={{ 
                      left: `${agent.position_x}px`, 
                      top: `${agent.position_y}px`,
                      border: isDragging === agent.id ? '2px solid #0EA5E9' : '1px solid #e5e7eb',
                      zIndex: isDragging === agent.id ? 10 : 1
                    }}
                    onMouseDown={(e) => handleDragStart(e, agent.id, agent.position_x, agent.position_y)}
                  >
                    <div className="text-2xl mb-1">🤖</div>
                    <div className="text-text-primary text-sm font-medium truncate w-full text-center px-2">
                      {agents.find(a => a.id === agent.agent_id)?.name || 'Agent'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAgent(agent.id);
                      }}
                      className="absolute top-1 right-1 text-text-secondary hover:text-error text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {showAgentSelector && (
                  <div 
                    className="absolute bg-surface rounded-md shadow-md p-4 z-20"
                    style={{ 
                      left: `${selectedAgentPosition.x}px`, 
                      top: `${selectedAgentPosition.y}px`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-text-primary font-medium mb-2">Select Agent</h3>
                    <div className="max-h-40 overflow-y-auto">
                      {agents.length === 0 ? (
                        <p className="text-text-secondary">No agents available</p>
                      ) : (
                        <ul className="space-y-2">
                          {agents.map((agent) => (
                            <li key={agent.id}>
                              <button
                                onClick={() => handleAddAgent(agent.id)}
                                className="w-full text-left px-2 py-1 hover:bg-background rounded text-text-primary"
                              >
                                {agent.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => setShowAgentSelector(false)}
                        className="text-text-secondary hover:text-text-primary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-text-secondary text-sm mt-2">
                Click anywhere on the canvas to add an agent. Drag agents to reposition them.
              </p>
            </div>

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Chat</h2>
              <div className="bg-background rounded-md h-96 p-4 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-text-secondary py-4">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isUser = message.sender_type === 'user';
                      const agentName = isUser ? 'You' : 
                        agents.find(a => a.id === message.sender_id)?.name || 'Agent';
                      
                      return (
                        <div 
                          key={message.id} 
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-3/4 rounded-lg px-4 py-2 ${
                              isUser 
                                ? 'bg-primary text-white' 
                                : 'bg-surface text-text-primary'
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {agentName} • {new Date(message.created_at).toLocaleTimeString()}
                            </div>
                            <div>{message.content}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-grow px-3 py-2 border border-surface bg-background text-text-primary rounded-l-md focus:outline-none focus:ring-primary focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary/90"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Conflict Resolution</h2>
              <div className="bg-background rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-text-primary font-medium">Auto-resolve conflicts</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-surface peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <p className="text-text-secondary text-sm">
                  When enabled, conflicts between agents will be automatically resolved using Gemini scoring.
                  When disabled, you'll be prompted to manually resolve conflicts.
                </p>
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Session Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-text-secondary text-sm">Created</div>
                  <div className="text-text-primary">
                    {new Date(currentSession.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">Last Updated</div>
                  <div className="text-text-primary">
                    {new Date(currentSession.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">ID</div>
                  <div className="text-text-primary text-sm font-mono truncate">
                    {currentSession.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SandboxDetailPage;
