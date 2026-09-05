import React, { useEffect, useState } from 'react';
import { Send, MessageSquare, Clock, User } from 'lucide-react';
import { messagingApi } from '../../services/api';
import { Conversation } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const CustomerMessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await messagingApi.getConversations();
      const list = res.data.results || res.data || [];
      setConversations(list);
      if (list.length > 0 && !selectedConv) {
        loadConversationDetails(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const res = await messagingApi.getConversation(id);
      setSelectedConv(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv) return;
    setSending(true);
    try {
      await messagingApi.sendMessage(selectedConv.id, messageText);
      setMessageText('');
      loadConversationDetails(selectedConv.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading messages..." />;

  return (
    <div className="h-[75vh] bg-metal-900 border border-metal-800 rounded-xl overflow-hidden flex flex-col md:flex-row text-left shadow-2xl">
      {/* Left List of Conversations */}
      <div className="w-full md:w-80 border-r border-metal-800 flex flex-col bg-metal-950/60">
        <div className="p-4 border-b border-metal-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Conversations
          </h3>
          <span className="text-[10px] bg-metal-800 text-metal-400 px-2 py-0.5 rounded font-mono">
            {conversations.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-metal-800/60">
          {conversations.length === 0 ? (
            <p className="p-4 text-xs text-gray-500 text-center">No messages yet.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversationDetails(conv.id)}
                className={`w-full p-4 text-left transition-colors flex flex-col space-y-1 ${
                  selectedConv?.id === conv.id ? 'bg-metal-800/80 border-l-2 border-brand-red' : 'hover:bg-metal-800/40'
                }`}
              >
                <span className="text-xs font-bold text-white truncate">{conv.subject}</span>
                <span className="text-[10px] text-gray-400">
                  {new Date(conv.last_message_at).toLocaleDateString()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Chat Window */}
      <div className="flex-1 flex flex-col bg-metal-900">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-metal-800 flex items-center justify-between bg-metal-950/40">
              <div>
                <h4 className="text-xs font-bold text-white uppercase">{selectedConv.subject}</h4>
                <span className="text-[10px] text-emerald-400">Workshop Staff Online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.is_me ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md p-3 rounded-xl text-xs ${
                      m.is_me
                        ? 'bg-brand-red text-white rounded-br-none'
                        : 'bg-metal-800 text-gray-200 rounded-bl-none border border-metal-700'
                    }`}
                  >
                    <p className="leading-relaxed">{m.content}</p>
                    <span className="text-[9px] opacity-70 mt-1 block text-right">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-metal-800 flex items-center space-x-2 bg-metal-950/60">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message to Bole Arabsa workshop..."
                className="flex-1 bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
              />
              <button
                type="submit"
                disabled={sending}
                className="bg-brand-red hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-500">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
};
