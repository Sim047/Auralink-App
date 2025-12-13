// frontend/src/components/ConversationsList.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Avatar from "./Avatar";
import { Menu } from "@headlessui/react";
import { MoreVertical, Trash2, MessageSquareOff } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";

export default function ConversationsList({
  token,
  onOpenConversation,
  currentUserId,
  onShowProfile,
}: any) {
  const [conversations, setConversations] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    loadConversations();
  }, [token]);

  function loadConversations() {
    setLoading(true);
    axios
      .get(API + "/api/conversations", {
        headers: { Authorization: "Bearer " + token },
      })
      .then((r) => {
        const convs = r.data || [];
        setConversations(convs);
        
        // Calculate total unread - only from conversations that actually exist
        const total = convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setTotalUnread(total);
        console.log(`[ConversationsList] Loaded ${convs.length} conversations, ${total} unread`);
      })
      .catch((err) => {
        console.error("ConversationsList error:", err);
        setConversations([]);
        setTotalUnread(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function avatarUrl(u: any) {
    if (!u?.avatar) return PLACEHOLDER;
    if (u.avatar.startsWith("http")) return u.avatar;
    if (u.avatar.startsWith("/")) return API + u.avatar;
    return API + "/uploads/" + u.avatar;
  }

  async function handleDeleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation? (Only for you)")) return;

    try {
      await axios.delete(`${API}/api/conversations/${convId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      
      // Reload conversations from server (will filter out if empty)
      loadConversations();
    } catch (err) {
      console.error("Delete conversation error:", err);
      alert("Failed to delete conversation");
    }
  }

  async function handleClearMessages(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Clear all messages in this chat? (Only for you)")) return;

    try {
      await axios.delete(`${API}/api/conversations/${convId}/messages`, {
        headers: { Authorization: "Bearer " + token },
      });
      
      // Reload conversations from server (will filter out if empty)
      loadConversations();
    } catch (err) {
      console.error("Clear messages error:", err);
      alert("Failed to clear messages");
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* Total Unread Badge - only show if there are actual conversations with unread messages */}
      {!loading && conversations.length > 0 && totalUnread > 0 && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-lg text-center font-semibold shadow-lg">
          {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-slate-600 dark:text-slate-400">
          <div className="text-4xl mb-3">💬</div>
          <div>No conversations yet</div>
          <div className="text-xs mt-2">Start chatting with users from the All Users page</div>
        </div>
      ) : (
        conversations.map((c: any) => {
          const partner = (c.participants || []).find(
            (p: any) => String(p._id) !== String(currentUserId)
          );

          if (!partner) return null;

          const unreadCount = c.unreadCount || 0;

          return (
            <div
              key={c._id}
              className={`
                flex flex-col sm:flex-row sm:items-center sm:justify-between 
                p-3 sm:p-4 rounded-lg 
                bg-white dark:bg-slate-800
                border-2 transition-all
                ${unreadCount > 0 
                  ? 'border-cyan-400 dark:border-cyan-500 shadow-md shadow-cyan-100 dark:shadow-cyan-900/30' 
                  : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                }
                gap-3 relative
              `}
            >
              {/* Unread Badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  src={avatarUrl(partner)}
                  onClick={() => onShowProfile(partner)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-md object-cover cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
                  alt={partner.username}
                />

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onShowProfile(partner)}
                >
                  <div className={`font-bold truncate ${unreadCount > 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    {partner.username}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
                    {partner.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  className="flex-1 sm:flex-none px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-medium hover:shadow-md transition-shadow"
                  onClick={() => onOpenConversation(c)}
                >
                  Open Chat
                </button>

                {/* Options Menu */}
                <Menu as="div" className="relative">
                  <Menu.Button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => handleClearMessages(c._id, e)}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300`}
                        >
                          <MessageSquareOff className="w-4 h-4" />
                          Clear Messages
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => handleDeleteConversation(c._id, e)}
                          className={`${
                            active ? 'bg-red-50 dark:bg-red-900/20' : ''
                          } flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400`}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Conversation
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
