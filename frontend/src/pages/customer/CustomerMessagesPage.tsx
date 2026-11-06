import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Send, MessageSquare, Paperclip, X, FileText, CheckCheck, 
  Clock, Plus, ChevronRight, FileCode, ExternalLink, ShieldAlert, Download, Image as ImageIcon
} from 'lucide-react';
import { messagingApi, quotesApi } from '../../services/api';
import { Conversation, Message } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ImageLightboxModal } from '../../components/common/ImageLightboxModal';
import { getMediaUrl, isImageFile, downloadFile } from '../../utils/media';

export const CustomerMessagesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const targetConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');
  const [newAttachment, setNewAttachment] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadConversations();
  }, [targetConvId]);

  // Periodic background refresh for conversation list and active messages
  useEffect(() => {
    if (!selectedConv?.id) return;
    const interval = setInterval(() => {
      messagingApi.getConversation(selectedConv.id)
        .then(res => {
          setSelectedConv(prev => {
            if (!prev || prev.id !== res.data.id) return res.data;
            if (prev.messages?.length !== res.data.messages?.length) {
              return res.data;
            }
            return prev;
          });
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  useEffect(() => {
    const listInterval = setInterval(() => {
      messagingApi.getConversations()
        .then(res => {
          const list = res.data.results || res.data || [];
          setConversations(list);
        })
        .catch(() => {});
    }, 8000);

    return () => clearInterval(listInterval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConv?.messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await messagingApi.getConversations();
      let list: Conversation[] = res.data.results || res.data || [];

      // If user has zero conversations, auto-initialize their general thread
      if (list.length === 0) {
        try {
          const genRes = await messagingApi.getGeneralConversation();
          if (genRes.data) {
            list = [genRes.data];
          }
        } catch (e) {
          console.error('Failed to init general conversation', e);
        }
      }

      setConversations(list);

      if (targetConvId) {
        const found = list.find(c => c.id === targetConvId);
        if (found) {
          loadConversationDetails(found.id);
          return;
        }
      }

      if (list.length > 0) {
        loadConversationDetails(list[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetails = async (id: string) => {
    try {
      const res = await messagingApi.getConversation(id);
      setSelectedConv(res.data);
      // update unread in conversation list locally
      setConversations(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    } catch (err) {
      console.error('Error loading conversation details:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachment) || !selectedConv) return;

    setSending(true);
    try {
      let payload: any;
      if (attachment) {
        const formData = new FormData();
        if (messageText.trim()) formData.append('content', messageText.trim());
        formData.append('attachment', attachment);
        payload = formData;
      } else {
        payload = { content: messageText.trim() };
      }

      await messagingApi.sendMessage(selectedConv.id, payload);
      setMessageText('');
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadConversationDetails(selectedConv.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;

    setCreating(true);
    try {
      let payload: any;
      if (newAttachment) {
        const fd = new FormData();
        fd.append('subject', newSubject.trim());
        fd.append('initial_message', newInitialMsg.trim());
        fd.append('attachment', newAttachment);
        payload = fd;
      } else {
        payload = {
          subject: newSubject.trim(),
          initial_message: newInitialMsg.trim()
        };
      }

      const res = await messagingApi.createConversation(payload);
      setShowNewModal(false);
      setNewSubject('');
      setNewInitialMsg('');
      setNewAttachment(null);

      // Reload conversations and select the newly created one
      const convRes = await messagingApi.getConversations();
      const list = convRes.data.results || convRes.data || [];
      setConversations(list);
      if (res.data?.id) {
        loadConversationDetails(res.data.id);
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your messages..." />;

  return (
    <div className="space-y-4">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-red" />
            Messages & Inquiries
          </h1>
          <p className="text-xs text-metal-400">
            Direct communication with HARA WORKSHOP engineering & production team in Addis Ababa
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-red hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Inquiry
        </button>
      </div>

      {/* Main Messaging Layout */}
      <div className="h-[75vh] bg-metal-900 border border-metal-800 rounded-xl overflow-hidden flex flex-col md:flex-row text-left shadow-2xl">
        {/* Sidebar: Conversation List */}
        <div className="w-full md:w-80 border-r border-metal-800 flex flex-col bg-metal-950/70">
          <div className="p-3 border-b border-metal-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Discussions ({conversations.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-metal-800/60">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-metal-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No active conversations</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-3 text-xs text-brand-red hover:underline font-semibold"
                >
                  Start your first inquiry &rarr;
                </button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadConversationDetails(conv.id)}
                    className={`w-full p-3.5 text-left transition-colors flex flex-col gap-1 border-l-2 ${
                      isSelected
                        ? 'bg-metal-800/80 border-brand-red text-white'
                        : 'border-transparent hover:bg-metal-800/40 text-metal-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate text-white">
                        {conv.subject}
                      </span>
                      {conv.unread_count > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-red text-white rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.quotation_details && (
                      <span className="text-[10px] text-brand-red/90 font-mono">
                        Quote #{conv.quotation_details.quote_number}
                      </span>
                    )}
                    {conv.order_details && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Order #{conv.order_details.order_number}
                      </span>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-metal-500 mt-1">
                      <span className="truncate max-w-[150px]">
                        {conv.last_message?.content || 'Initial inquiry'}
                      </span>
                      <span>
                        {new Date(conv.last_message_at || conv.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-metal-900">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-metal-800 flex items-center justify-between bg-metal-950/40">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedConv.subject}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-metal-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      HARA WORKSHOP Support Desk
                    </span>
                    {selectedConv.quotation_details && (
                      <Link
                        to={`/customer/quotes/${selectedConv.quotation_details.id}`}
                        className="text-brand-red hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        Ref: Quote #{selectedConv.quotation_details.quote_number}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {selectedConv.order_details && (
                      <Link
                        to={`/customer/orders/${selectedConv.order_details.id}`}
                        className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        Ref: Order #{selectedConv.order_details.order_number}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {selectedConv.messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-metal-500">
                    No messages in this inquiry yet. Send a message below to reach the workshop.
                  </div>
                ) : (
                  selectedConv.messages.map((m: Message) => {
                    const isMe = m.is_me;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-metal-500">
                          <span className="font-semibold text-metal-400">
                            {isMe ? 'You' : (m.sender_name || 'HARA Workshop')}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-brand-red text-white rounded-tr-none shadow-md'
                              : 'bg-metal-800 text-gray-200 rounded-tl-none border border-metal-700 shadow'
                          }`}
                        >
                          {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                          {m.attachment && (
                            <div className="mt-2.5 pt-2 border-t border-white/20">
                              {isImageFile(m.attachment_name || m.attachment) ? (
                                <div className="space-y-1.5">
                                  <div
                                    onClick={() => setLightboxImage({ url: m.attachment!, title: m.attachment_name || 'Attached Image' })}
                                    className="relative group cursor-pointer overflow-hidden rounded-lg border border-white/20 bg-black/20"
                                  >
                                    <img
                                      src={getMediaUrl(m.attachment)}
                                      alt={m.attachment_name || 'Uploaded picture'}
                                      className="max-h-48 max-w-full rounded-lg object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-[11px] font-medium">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>Click to view full image</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 px-0.5">
                                    <span className="text-[10px] truncate max-w-[180px] font-mono opacity-80">
                                      {m.attachment_name || 'Image'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => downloadFile(m.attachment!, m.attachment_name || 'image')}
                                      className={`inline-flex items-center gap-1 text-[10px] font-semibold underline transition-opacity hover:opacity-100 ${
                                        isMe ? 'text-white/90' : 'text-brand-red'
                                      }`}
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Save</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => downloadFile(m.attachment!, m.attachment_name || 'attachment')}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors ${
                                      isMe
                                        ? 'bg-white/20 hover:bg-white/30 text-white'
                                        : 'bg-metal-700 hover:bg-metal-600 text-brand-red'
                                    }`}
                                  >
                                    <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate max-w-[170px]">{m.attachment_name || 'View Attachment'}</span>
                                    <Download className="w-3 h-3 ml-1 opacity-75 flex-shrink-0" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment preview bar */}
              {attachment && (
                <div className="px-4 py-2 bg-metal-950/90 border-t border-metal-800 flex items-center justify-between text-xs text-metal-300">
                  <div className="flex items-center gap-2 truncate">
                    {isImageFile(attachment.name) ? (
                      <ImageIcon className="w-3.5 h-3.5 text-brand-red" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 text-brand-red" />
                    )}
                    <span className="truncate font-mono">{attachment.name}</span>
                    <span className="text-[10px] text-metal-500">
                      ({(attachment.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachment(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-metal-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-metal-800 flex items-center gap-2 bg-metal-950/60"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachment(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach specification, sketch, or image"
                  className="p-2 text-metal-400 hover:text-white hover:bg-metal-800 rounded-lg transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message to Bole Arabsa workshop..."
                  className="flex-1 bg-metal-900 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red placeholder-metal-500"
                />

                <button
                  type="submit"
                  disabled={sending || (!messageText.trim() && !attachment)}
                  className="bg-brand-red hover:bg-red-700 text-white px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-metal-500 text-xs gap-3 p-6">
              <MessageSquare className="w-10 h-10 text-metal-700" />
              <p>Select a discussion thread or start a new inquiry.</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
              >
                + Start New Inquiry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Inquiry Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-metal-900 border border-metal-800 rounded-2xl w-full max-w-md p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-metal-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-red" />
                Start New Inquiry
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-metal-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewConversation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-metal-300 mb-1">
                  Subject / Project Topic *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Motorized Sliding Gate, Custom Dining Table..."
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-metal-300 mb-1">
                  Message / Requirements *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  placeholder="Describe your dimensions, material preference, or questions for our engineers..."
                  className="w-full bg-metal-950 border border-metal-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-medium text-metal-300 mb-1">
                  Optional Blueprint, Sketch, or Photo
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewAttachment(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-metal-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-metal-800 file:text-white hover:file:bg-metal-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-metal-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-metal-800 hover:bg-metal-700 text-metal-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newSubject.trim() || !newInitialMsg.trim()}
                  className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? 'Sending...' : 'Send Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Preview Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        title={lightboxImage?.title}
      />
    </div>
  );
};