// frontend/src/App.tsx
import React, { useEffect, useState, useRef, Fragment } from "react";
import { socket } from "./socket";
import axios from "axios";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import clsx from "clsx";
import { Menu, Transition } from "@headlessui/react";
import { Settings, Send, Trash2, X, Zap } from "lucide-react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StatusPicker from "./components/StatusPicker";
import SearchUsers from "./components/SearchUsers";
import ConversationsList from "./components/ConversationsList";
import AllUsers from "./pages/AllUsersModern";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import Discover from "./pages/Discover";
import SportsEvents from "./pages/SportsEvents";
import Dashboard from "./pages/Dashboard";
import MyEvents from "./pages/MyEvents";
import Posts from "./pages/Posts";
import Avatar from "./components/Avatar";
import Sidebar from "./components/Sidebar";
import AssistantWidget from "./components/AssistantWidget";
import logo from "./assets/logo.png";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SAMPLE_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";

const THEME_KEY = "auralink-theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
}

type User = {
  _id?: string;
  id?: string;
  username?: string;
  email?: string;
  avatar?: string;
  role?: string;
  followers?: string[] | number;
  following?: string[] | number;
};

export default function App() {
  const [theme, setTheme] = useState<string>(getInitialTheme());
  
  useEffect(() => {
    // Add smooth transition class
    document.documentElement.style.setProperty('--theme-transition', '0.3s');
    
    // Update theme class
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    
    // Persist theme
    localStorage.setItem(THEME_KEY, theme);
    
    // Log for debugging
    console.log(`Theme switched to: ${theme}`);
  }, [theme]);
  
  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // AUTH --------------------------------------
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [authPage, setAuthPage] = useState<"login" | "register">("login");

  // DM --------------------------------
  const [room, setRoom] = useState<string>("general");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});

  // STATUS ------------------------------------
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  
  // ONLINE USERS ------------------------------
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // UI refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesSectionRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // DM & conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [inDM, setInDM] = useState(() => {
    const saved = localStorage.getItem("auralink-in-dm");
    return saved ? JSON.parse(saved) : false;
  });
  const [activeConversation, setActiveConversation] = useState<any | null>(() => {
    const saved = localStorage.getItem("auralink-active-conversation");
    return saved ? JSON.parse(saved) : null;
  });
  
  // Persist DM state
  useEffect(() => {
    localStorage.setItem("auralink-in-dm", JSON.stringify(inDM));
  }, [inDM]);
  
  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem("auralink-active-conversation", JSON.stringify(activeConversation));
    } else {
      localStorage.removeItem("auralink-active-conversation");
    }
  }, [activeConversation]);

  // dynamic pages
  const [view, setView] = useState<
    "dashboard" | "discover" | "chat" | "all-users" | "followers" | "following" | "posts" | "direct-messages"
  >(() => {
    // Restore previous view from localStorage
    const saved = localStorage.getItem("auralink-current-view");
    return (saved as any) || "dashboard";
  });
  
  // Persist view changes to localStorage
  useEffect(() => {
    localStorage.setItem("auralink-current-view", view);
  }, [view]);

  // editing messages
  const [editingMessageId, setEditingMessageId] =
    useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // PROFILE MODAL -----------------------------
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFollowersCount, setProfileFollowersCount] =
    useState<number | null>(null);
  const [profileFollowingCount, setProfileFollowingCount] =
    useState<number | null>(null);
  const [profileIsFollowed, setProfileIsFollowed] =
    useState<boolean>(false);

  // DM collapse
  const [dmOpen, setDmOpen] = useState<boolean>(true);

  // Missing states and helpers added
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [unreadIndex, setUnreadIndex] = useState<number>(-1);
  const [enterToSend, setEnterToSend] = useState<boolean>(() => {
    const saved = localStorage.getItem("enterToSend");
    return saved ? JSON.parse(saved) : false;
  });

  // Conversation refresh key
  const [conversationRefreshKey, setConversationRefreshKey] = useState<number>(0);
  const refreshConversations = () => setConversationRefreshKey((k) => k + 1);

function shouldShowAvatar(index: number) {
  if (index === 0) return true;
  return (
    messages[index - 1]?.sender?._id !== messages[index]?.sender?._id
  );
}

function toggleEnterToSend() {
  const newValue = !enterToSend;
  setEnterToSend(newValue);
  localStorage.setItem("enterToSend", JSON.stringify(newValue));
}

function jumpToUnread() {
  if (unreadRef.current) unreadRef.current.scrollIntoView({ behavior: "smooth" });
}

function startEdit(m: any) {
  setEditingMessageId(m._id);
  setEditingText(m.text || "");
}

function cancelEdit() {
  setEditingMessageId(null);
  setEditingText("");
}

async function saveEdit(id: string) {
  if (!token) return;
  
  // Optimistic update - update message immediately
  setMessages((m) => m.map((msg) => 
    msg._id === id ? { ...msg, text: editingText, edited: true } : msg
  ));
  setEditingMessageId(null);
  
  try {
    await axios.put(
      API + "/api/messages/" + id,
      { text: editingText },
      { headers: { Authorization: "Bearer " + token } }
    );
    socket.emit("edit_message", { messageId: id, text: editingText });
  } catch (e) {
    console.error("Edit failed", e);
    // Could revert the edit here if it failed
  }
}

async function deleteMessage(id: string) {
  if (!token) return;
  
  // Optimistic update - remove message immediately from my view
  setMessages((m) => m.filter((x) => x._id !== id));
  
  try {
    // REST endpoint handles per-user hiding and sends socket event only to me
    await axios.delete(API + "/api/messages/" + id, {
      headers: { Authorization: "Bearer " + token }
    });
  } catch (e) {
    console.error("Delete failed", e);
    // Could reload messages here if delete failed
  }
}

function onMyStatusUpdated(newStatus: any) {
  const uid = String(user?._id || user?.id);
  console.log("App: onMyStatusUpdated called with:", newStatus, "for user:", uid);
  setStatuses((s) => {
    const updated = { ...s };
    if (newStatus === null) {
      delete updated[uid];
      console.log("App: Cleared status for user:", uid);
    } else {
      updated[uid] = newStatus;
      console.log("App: Updated status for user:", uid, newStatus);
    }
    return updated;
  });
}

  const myStatus =
    statuses[String(user?._id || user?.id)] || null;

  function makeAvatarUrl(avatar?: string | null) {
    if (!avatar) return SAMPLE_AVATAR;
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return API + avatar;
    return API + "/uploads/" + avatar;
  }
  
  // SOCKET SETUP -------------------------------------------------
  useEffect(() => {
    if (!token || !user) return;

    socket.auth = { token, user };
    socket.connect();
    
    // Join initial room
    const initialRoom = inDM && activeConversation ? activeConversation._id : room;
    socket.emit("join_room", initialRoom);
    console.log("[Socket] Joined room:", initialRoom);

    socket.on("receive_message", async (msg: any) => {
      setMessages((m) => {
        // Remove any pending/optimistic messages from the same user with similar timestamp
        const filtered = m.filter((existing) => {
          if (!existing.isPending) return true;
          // Remove pending message if we received the real one
          if (existing.sender?._id === msg.sender?._id && 
              existing.text === msg.text &&
              Math.abs(new Date(existing.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000) {
            return false;
          }
          return true;
        });
        
        // Check if message already exists (prevent duplicates)
        const exists = filtered.some((existing) => existing._id === msg._id);
        if (exists) return filtered;
        
        return [...filtered, msg];
      });
      scrollToBottom();
      
      // Mark as delivered if not sender
      if (msg.sender?._id !== user?._id) {
        socket.emit("message_delivered", { messageId: msg._id, userId: user?._id });
        
        // Also mark as read immediately if chat is visible (view === "chat")
        if (view === "chat") {
          socket.emit("message_read", { messageId: msg._id, userId: user?._id });
          
          // Mark conversation as read if it's a DM and we're viewing it
          if (inDM && activeConversation?._id && token) {
            try {
              await axios.post(
                `${API}/api/conversations/${activeConversation._id}/read`,
                {},
                { headers: { Authorization: "Bearer " + token } }
              );
            } catch (err) {
              console.error("Failed to mark conversation as read:", err);
            }
          }
        }
        
        // Show browser notification for messages from others (only if not currently viewing chat)
        if (view !== "chat" && "Notification" in window && Notification.permission === "granted") {
          const senderName = msg.sender?.username || "Someone";
          const messageText = msg.text || (msg.fileUrl ? "Sent an image" : "New message");
          const notification = new Notification(`${senderName}`, {
            body: messageText.substring(0, 100),
            icon: msg.sender?.avatar ? (msg.sender.avatar.startsWith("http") ? msg.sender.avatar : API + "/uploads/" + msg.sender.avatar) : SAMPLE_AVATAR,
            tag: msg._id,
            requireInteraction: false
          });
          
          // Auto-close after 5 seconds
          setTimeout(() => notification.close(), 5000);
          
          // Focus window when clicking notification
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      }
    });

    socket.on("message_status_update", (updatedMsg: any) => {
      setMessages((m) => m.map((x) => (x._id === updatedMsg._id ? updatedMsg : x)));
    });

    socket.on("reaction_update", (msg: any) => {
      setMessages((m) => m.map((x) => (x._id === msg._id ? msg : x)));
    });

    socket.on("typing", ({ userId, typing, user: typingUser }: any) => {
      console.log("[Socket] Typing event:", { userId, typing, user: typingUser });
      if (typing) {
        setTypingUsers((t) => {
          const updated = { ...t, [userId]: typingUser || { username: 'Someone' } };
          console.log("[Socket] Typing users updated:", updated);
          return updated;
        });
        
        // Clear typing indicator after 3 seconds of inactivity
        setTimeout(() => {
          setTypingUsers((t) => {
            const updated = { ...t };
            delete updated[userId];
            return updated;
          });
        }, 3000);
      } else {
        setTypingUsers((t) => {
          const updated = { ...t };
          delete updated[userId];
          return updated;
        });
      }
    });

    socket.on("message_edited", (updatedMsg: any) => {
      setMessages((m) =>
        m.map((x) => (x._id === updatedMsg._id ? updatedMsg : x))
      );
    });

    socket.on("message_hidden", ({ messageId }: { messageId: string }) => {
      // Only remove from my view when I hide a message
      setMessages((m) => m.filter((x) => x._id !== messageId));
    });

    socket.on("status_update", (payload: any) => {
      if (payload?.cleared) {
        setStatuses((s) => {
          const c = { ...s };
          delete c[payload.user];
          return c;
        });
      } else if (payload?.user) {
        const uid = String(payload.user._id || payload.user);
        setStatuses((s) => ({ ...s, [uid]: payload }));
      }
    });
    
    socket.on("presence_update", ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      console.log("[Socket] Presence update:", userId, status);
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (status === "online") {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        console.log("[Socket] Online users:", Array.from(updated));
        return updated;
      });
    });

    // Receive initial online users list when connecting
    socket.on("online_users_list", ({ userIds }: { userIds: string[] }) => {
      console.log("[Socket] Received online users list:", userIds);
      setOnlineUsers(new Set(userIds));
    });

    // Join request notifications
    socket.on("join_request_created", ({ eventTitle, organizerId }: any) => {
      if (user?._id === organizerId) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Join Request", {
            body: `Someone requested to join your event: ${eventTitle}`,
            icon: "/logo.png",
          });
        }
      }
    });

    socket.on("join_request_approved", ({ eventTitle, userId }: any) => {
      if (user?._id === userId) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Join Request Approved", {
            body: `Your request to join "${eventTitle}" has been approved!`,
            icon: "/logo.png",
          });
        }
      }
    });

    socket.on("join_request_rejected", ({ eventTitle, userId }: any) => {
      if (user?._id === userId) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Join Request Rejected", {
            body: `Your request to join "${eventTitle}" was not approved.`,
            icon: "/logo.png",
          });
        }
      }
    });

    // Booking status update notifications
    socket.on("booking_status_update", ({ bookingId, status, approvalStatus, message, paymentVerified }: any) => {
      console.log("[Socket] Booking status update:", { bookingId, status, message });
      
      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Booking Update", {
          body: message,
          icon: "/logo.png",
        });
      }
      
      // Show in-app alert (optional - could be a toast notification instead)
      alert(message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, user]);
  
  // Rejoin socket room when room or conversation changes
  useEffect(() => {
    if (!socket.connected) return;
    
    const targetRoom = inDM && activeConversation ? activeConversation._id : room;
    console.log("[Socket] Switching to room:", targetRoom);
    socket.emit("join_room", targetRoom);
  }, [room, inDM, activeConversation]);

  // LOAD ROOM MESSAGES ------------------------------------------
  useEffect(() => {
    if (!token || inDM || view !== "chat") return;

    axios
      .get(API + "/api/messages/" + room, {
        headers: { Authorization: "Bearer " + token }
      })
      .then((r) => {
        setMessages(r.data || []);
        
        // Mark messages as read when loading chat
        if (user && socket) {
          (r.data || []).forEach((msg: any) => {
            if (msg.sender?._id !== user._id && !msg.readBy?.some((id: any) => String(id) === String(user._id))) {
              socket.emit("message_read", { messageId: msg._id, userId: user._id });
            }
          });
        }
      })
      .catch(() => {});
  }, [room, token, view, inDM, user, socket]);

  // LOAD DM MESSAGES --------------------------------------------
  useEffect(() => {
    if (!token || !inDM || !activeConversation) return;

    axios
      .get(
        API + "/api/conversations/" + activeConversation._id + "/messages",
        { headers: { Authorization: "Bearer " + token } }
      )
      .then((r) => {
        setMessages(r.data || []);
        
        // Mark messages as read when loading DM conversation
        if (user && socket) {
          (r.data || []).forEach((msg: any) => {
            if (msg.sender?._id !== user._id && !msg.readBy?.some((id: any) => String(id) === String(user._id))) {
              socket.emit("message_read", { messageId: msg._id, userId: user._id });
            }
          });
        }
      })
      .catch((e) => console.error("DM load error", e));
  }, [token, inDM, activeConversation, user, socket]);

  // LOAD ALL STATUSES -------------------------------------------
  useEffect(() => {
    if (!token) return;

    axios
      .get(API + "/api/status", {
        headers: { Authorization: "Bearer " + token }
      })
      .then((r) => {
        const map: Record<string, any> = {};
        (r.data || []).forEach((st: any) => {
          const uid = String(st.user?._id || st.user);
          map[uid] = st;
        });
        setStatuses(map);
      })
      .catch(() => {});
  }, [token]);

  // LOAD USER CONVERSATIONS -------------------------------------
  useEffect(() => {
    if (!token) return;

    axios
      .get(API + "/api/conversations", {
        headers: { Authorization: "Bearer " + token }
      })
      .then((r) => setConversations(r.data || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 40);
    return () => clearTimeout(t);
  }, [messages.length, view, inDM]);

  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  // SEND MESSAGE -------------------------------------------------
  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if (!text && selectedImages.length === 0) return;

    const fileUrls: string[] = [];

    if (selectedImages.length > 0) {
      for (const img of selectedImages) {
        const fd = new FormData();
        fd.append("file", img);

        try {
          const r = await axios.post(API + "/api/files/upload", fd, {
            headers: {
              Authorization: "Bearer " + token,
              "Content-Type": "multipart/form-data"
            }
          });
          if (r.data.url) fileUrls.push(r.data.url);
        } catch (e) {
          console.error("Image upload failed:", e);
        }
      }
    }

    const targetRoom =
      inDM && activeConversation ? activeConversation._id : room;

    // Send message with all uploaded images
    if (fileUrls.length > 0) {
      for (const fileUrl of fileUrls) {
        const optimisticMessage = {
          _id: `temp-${Date.now()}-${Math.random()}`,
          sender: user,
          text: fileUrls.indexOf(fileUrl) === 0 ? text : "",
          room: targetRoom,
          fileUrl,
          createdAt: new Date().toISOString(),
          isPending: true
        };
        
        // Add message immediately to UI (optimistic update)
        setMessages((m) => [...m, optimisticMessage]);
        
        socket.emit("send_message", {
          room: targetRoom,
          message: {
            sender: user,
            text: fileUrls.indexOf(fileUrl) === 0 ? text : "",
            room: targetRoom,
            fileUrl,
            createdAt: new Date().toISOString()
          }
        });
      }
    } else if (text) {
      const optimisticMessage = {
        _id: `temp-${Date.now()}-${Math.random()}`,
        sender: user,
        text,
        room: targetRoom,
        fileUrl: "",
        createdAt: new Date().toISOString(),
        isPending: true
      };
      
      // Add message immediately to UI (optimistic update)
      setMessages((m) => [...m, optimisticMessage]);
      
      socket.emit("send_message", {
        room: targetRoom,
        message: {
          sender: user,
          text,
          room: targetRoom,
          fileUrl: "",
          createdAt: new Date().toISOString()
        }
      });
    }

    setText("");
    setSelectedImages([]);
    setFile(null);
    
    // Reset textarea height
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = '48px';
      }
    }, 0);
    
    scrollToBottom();
    
    // Refresh conversations if this was a DM (to update lastMessage and unread counts)
    if (inDM) {
      refreshConversations();
    }
  }

  // TYPING -------------------------------------------------------
  function onComposerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);

    const typingData = {
      room: inDM && activeConversation ? activeConversation._id : room,
      userId: user?._id,
      user: { _id: user?._id, username: user?.username, avatar: user?.avatar },
      typing: !!e.target.value
    };
    console.log("[Socket] Emitting typing:", typingData);
    socket.emit("typing", typingData);
  }

  // Handle Enter key press
  function handleKeyPress(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter") {
      // Shift+Enter always creates a new line
      if (e.shiftKey) {
        return; // Allow default behavior (new line)
      }
      
      if (enterToSend && !e.ctrlKey) {
        // Enter alone sends if setting is enabled
        e.preventDefault();
        sendMessage();
      } else if (!enterToSend && (e.ctrlKey || e.metaKey)) {
        // Ctrl+Enter or Cmd+Enter sends if setting is disabled
        e.preventDefault();
        sendMessage();
      }
      // Shift+Enter always allows new line (browser default)
    }
  }

  // IMAGE HANDLING -----------------------------------------------
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedImages((prev) => [...prev, ...files]);
      setImagePreviewOpen(true);
    }
    e.target.value = ""; // Reset input
  }

  function removeImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAllImages() {
    setSelectedImages([]);
    setImagePreviewOpen(false);
  }

  // REACTIONS ----------------------------------------------------
  function reactionCount(msg: any, emoji: string) {
    return msg.reactions?.filter((r: any) => r.emoji === emoji).length || 0;
  }

  function hasReacted(msg: any, emoji: string) {
    const uid = String(user?._id || user?.id);
    return (
      msg.reactions?.some(
        (r: any) => r.userId === uid && r.emoji === emoji
      ) || false
    );
  }

  function toggleReaction(msg: any, emoji: string) {
    const uid = String(user?._id || user?.id);
    
    // Optimistic update - update UI immediately
    setMessages((m) => m.map((message) => {
      if (message._id !== msg._id) return message;
      
      const reactions = message.reactions || [];
      const existingReactionIndex = reactions.findIndex(
        (r: any) => r.userId === uid && r.emoji === emoji
      );
      
      let newReactions;
      if (existingReactionIndex >= 0) {
        // Remove reaction
        newReactions = reactions.filter((_: any, i: number) => i !== existingReactionIndex);
      } else {
        // Add reaction
        newReactions = [...reactions, { userId: uid, emoji }];
      }
      
      return { ...message, reactions: newReactions };
    }));
    
    // Send to server
    socket.emit("react", {
      room: inDM && activeConversation ? activeConversation._id : room,
      messageId: msg._id,
      userId: user?._id,
      emoji
    });
  }

  // PROFILE FIXED FUNCTION --------------------------------------
  async function showProfile(userOrId: any) {
    if (!token) return;

    const id =
      typeof userOrId === "string"
        ? userOrId
        : userOrId?._id || userOrId?.id;

    if (!id) return;

    // Open modal immediately to show loading state
    setProfileOpen(true);
    setProfileLoading(true);
    setProfileUser(null);

    try {
      // This is the ONLY correct endpoint.
      const res = await axios.get(API + "/api/users/" + id, {
        headers: { Authorization: "Bearer " + token }
      });

      const u = res.data;
      setProfileUser(u);

      // followers & following come directly from backend
      setProfileFollowersCount(
        Array.isArray(u.followers)
          ? u.followers.length
          : typeof u.followers === "number"
          ? u.followers
          : 0
      );

      setProfileFollowingCount(
        Array.isArray(u.following)
          ? u.following.length
          : typeof u.following === "number"
          ? u.following
          : 0
      );

      // detect if THIS user follows them
      setProfileIsFollowed(
        Array.isArray(u.followers)
          ? u.followers.map(String).includes(String(user?._id))
          : false
      );
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setProfileLoading(false);
    }
  }
  // FOLLOW / UNFOLLOW --------------------------------------------
  async function toggleFollowProfile() {
    if (!profileUser || !token) return;

    const id = profileUser._id;
    const following = profileIsFollowed;

    try {
      if (following) {
        await axios.post(
          API + "/api/users/" + id + "/unfollow",
          {},
          { headers: { Authorization: "Bearer " + token } }
        );

        setProfileIsFollowed(false);
        setProfileFollowersCount((c) => (c || 1) - 1);
      } else {
        await axios.post(
          API + "/api/users/" + id + "/follow",
          {},
          { headers: { Authorization: "Bearer " + token } }
        );

        setProfileIsFollowed(true);
        setProfileFollowersCount((c) => (c || 0) + 1);
      }
    } catch (e) {
      console.error("Follow error", e);
    }
  }
  // OPEN A DM FROM ANYWHERE --------------------------------------
  async function openConversation(conv: any) {
    setActiveConversation(conv);
    setInDM(true);
    setView("chat");

    if (socket.connected) {
      const roomId = conv._id || conv.id;
      console.log("[Socket] Opening conversation, joining room:", roomId);
      socket.emit("join_room", roomId);
    }

    // Mark conversation as read
    if (token && conv._id) {
      try {
        await axios.post(
          `${API}/api/conversations/${conv._id}/read`,
          {},
          { headers: { Authorization: "Bearer " + token } }
        );
      } catch (err) {
        console.error("Failed to mark conversation as read:", err);
      }
    }
  }

  // START DM FROM PROFILE ----------------------------------------
  async function messageFromProfile() {
    if (!profileUser) return;

    try {
      const res = await axios.post(
        API + "/api/conversations",
        { partnerId: profileUser._id },
        { headers: { Authorization: "Bearer " + token } }
      );

      openConversation(res.data);
      setProfileOpen(false);
    } catch (e) {
      console.error("Could not start conversation", e);
      alert("Unable to start conversation");
    }
  }

  // START DM WITH USER ID ----------------------------------------
  async function startConversationWithUser(userId: string) {
    console.log("[App] startConversationWithUser called with userId:", userId);
    console.log("[App] token exists:", !!token);
    
    if (!userId || !token) {
      alert("Please log in to send messages");
      return;
    }

    try {
      console.log("[App] Creating conversation with partnerId:", userId);
      const res = await axios.post(
        API + "/api/conversations",
        { partnerId: userId },
        { headers: { Authorization: "Bearer " + token } }
      );

      console.log("[App] Conversation created/fetched:", res.data);
      openConversation(res.data);
    } catch (e) {
      console.error("[App] Could not start conversation", e);
      alert("Unable to start conversation");
    }
  }

  // SCROLL TO BOTTOM ---------------------------------------------
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 200;
    setShowScrollButton(!isNearBottom);
  };

  // MESSAGE RENDERER ---------------------------------------------
  function renderMessages() {
    return messages.map((m, index) => {
      const date = dayjs(m.createdAt).format("YYYY-MM-DD");
      const prevDate =
        index > 0
          ? dayjs(messages[index - 1].createdAt).format("YYYY-MM-DD")
          : null;
      const showDate = date !== prevDate;

      const showAvatar = shouldShowAvatar(index);
      const unreadMark =
        unreadIndex >= 0 && index === unreadIndex ? true : false;

      const senderStatus =
        statuses[String(m.sender?._id || m.sender?.id)] || null;

      return (
        <Fragment key={m._id}>
          {showDate && (
            <div className="my-6 text-center">
              <span className="px-4 py-1 rounded-full card-date">
                {date === dayjs().format("YYYY-MM-DD")
                  ? "Today"
                  : date === dayjs().subtract(1, "day").format("YYYY-MM-DD")
                  ? "Yesterday"
                  : dayjs(m.createdAt).format("DD MMM YYYY")}
              </span>
            </div>
          )}

          {unreadMark && (
            <div
              ref={unreadRef}
              className="my-2 flex justify-center text-xs text-white"
            >
              <span className="px-3 py-1 rounded-md bg-orange-500">
                Unread messages
              </span>
            </div>
          )}

          <div
            className={clsx(
              "message flex gap-3 items-start",
              m.sender?._id === user?._id && "msg-mine"
            )}
            style={{
              transition: "opacity .25s, transform .25s",
              opacity: ready ? 1 : 0,
              transform: ready ? "translateY(0)" : "translateY(6px)"
            }}
          >
            {showAvatar ? (
              <Avatar
                src={makeAvatarUrl(m.sender?.avatar)}
                className="avatar w-10 h-10 rounded-md object-cover"
                alt={m.sender?.username || "User"}
              />
            ) : (
              <div style={{ width: 40 }} />
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                {showAvatar && <strong>{m.sender?.username}</strong>}
                <span
                  className="text-xs opacity-60"
                  title={dayjs(m.createdAt).format(
                    "dddd, DD MMM YYYY • HH:mm"
                  )}
                >
                  {dayjs(m.createdAt).format("HH:mm")}
                </span>

                {m.edited && (
                  <span className="text-xs opacity-50 ml-1">(edited)</span>
                )}

                {/* Message Status Ticks - only show for sender */}
                {String(m.sender?._id) === String(user?._id) && (
                  <span className="ml-2 text-xs flex items-center gap-0.5">
                    {m.readBy && m.readBy.length > 0 ? (
                      // Double blue tick for read
                      <span className="text-blue-500" title="Read">✓✓</span>
                    ) : m.deliveredTo && m.deliveredTo.length > 0 ? (
                      // Double gray tick for delivered
                      <span className="text-gray-400" title="Delivered">✓✓</span>
                    ) : (
                      // Single gray tick for sent
                      <span className="text-gray-400" title="Sent">✓</span>
                    )}
                  </span>
                )}

                {senderStatus && (
                  <span className="ml-3 text-xs px-2 py-0.5 card-status rounded-md flex items-center gap-1">
                    <span>{senderStatus.emoji}</span>
                    <span className="opacity-80">{senderStatus.mood}</span>
                  </span>
                )}
              </div>

              {m.fileUrl && (
                <img
                  src={m.fileUrl.startsWith('http') ? m.fileUrl : API + m.fileUrl}
                  className="max-w-full w-auto h-auto rounded-md mt-2"
                  style={{ maxHeight: "400px", objectFit: "contain" }}
                />
              )}

              {editingMessageId === m._id ? (
                <div className="flex gap-2 items-start mt-2">
                  <input
                    className="input p-2 rounded-md flex-1"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <button className="btn" onClick={() => saveEdit(m._id)}>
                    Save
                  </button>
                  <button
                    className="px-3 py-2 border rounded-md"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-2 break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{m.text}</div>
              )}

              <div className="flex gap-2 mt-2 items-center text-sm">
                {["❤️", "🔥", "😂", "😔"].map((emoji) => (
                  <button
                    key={emoji}
                    className={clsx(
                      "px-2 py-1 rounded-full border",
                      hasReacted(m, emoji) && "reacted"
                    )}
                    onClick={() => toggleReaction(m, emoji)}
                  >
                    {emoji} {reactionCount(m, emoji) || ""}
                  </button>
                ))}

                {String(m.sender?._id) === String(user?._id) && (
                  <div className="ml-4 flex gap-2 text-xs">
                    <button onClick={() => startEdit(m)}>Edit</button>
                    <button onClick={() => deleteMessage(m._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Fragment>
      );
    });
  }

  // AVATAR UPLOAD ------------------------------------------------
  function uploadAvatarDirect(e: any) {
    const f = e.target.files?.[0];
    if (f) setSelectedAvatar(f);
  }

  async function saveAvatar() {
    if (!selectedAvatar || !token) return;

    const fd = new FormData();
    fd.append("avatar", selectedAvatar);

    try {
      console.log("App: Uploading avatar...");
      const res = await axios.post(API + "/api/users/avatar", fd, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("App: Avatar upload response:", res.data);
      if (res.data?.user) {
        console.log("App: Updating user state with:", res.data.user);
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      setSelectedAvatar(null);
    } catch (e) {
      console.error("avatar upload error", e);
    }
  }

  // LOGOUT -------------------------------------------------------
  function logout() {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.reload();
  }

  // AUTH CHECK ---------------------------------------------------
  if (!token || !user) {
    return authPage === "login" ? (
      <Login
        onSuccess={({ token, user }) => {
          setToken(token);
          setUser(user);
        }}
        switchToRegister={() => setAuthPage("register")}
      />
    ) : (
      <Register
        onSuccess={({ token, user }) => {
          setToken(token);
          setUser(user);
        }}
        switchToLogin={() => setAuthPage("login")}
      />
    );
  }
  
  // ---- MAIN LAYOUT ----
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Unified Sidebar */}
      {token && (
        <Sidebar
          key={`${user?._id}-${user?.avatar}-${myStatus?.mood}-${myStatus?.emoji}-${JSON.stringify(user)}`}
          token={token}
          user={user}
          theme={theme}
          myStatus={myStatus}
          isOnline={user?._id ? onlineUsers.has(user._id) : false}
          onNavigate={(v) => {
            setView(v as any);
            setInDM(false);
            setActiveConversation(null);
          }}
          onThemeToggle={toggleTheme}
          onLogout={logout}
          onStatusUpdated={onMyStatusUpdated}
          onShowProfile={showProfile}
          onOpenConversation={openConversation}
          onAvatarUpload={uploadAvatarDirect}
          onAvatarSave={saveAvatar}
          onAvatarCancel={() => setSelectedAvatar(null)}
          selectedAvatar={selectedAvatar}
          conversations={conversations}
          makeAvatarUrl={makeAvatarUrl}
        />
      )}

      {/* ---------------- MAIN VIEW ---------------- */}
      <main 
        className={clsx(
          "flex-1 flex flex-col",
          view === "chat" ? "overflow-hidden h-screen" : "overflow-auto p-4 lg:p-6"
        )} 
        style={{ color: 'var(--text)' }}
      >
        {/* DASHBOARD PAGE */}
        {view === "dashboard" && (
          <Dashboard
            token={token}
            onNavigate={(newView: string) => setView(newView as any)}
          />
        )}
        
        {/* MY ACTIVITIES PAGE */}
        {(view === "my-activities" || view === "my-events") && (
          <MyEvents token={token} />
        )}
        
        {/* DISCOVER PAGE */}
        {view === "discover" && (
          <Discover
            token={token}
            onViewProfile={showProfile}
            onStartConversation={startConversationWithUser}
          />
        )}

        {/* SPORTS EVENTS PAGE (simplified booking flow) */}
        {view === "sports" && (
          <SportsEvents token={token} onViewProfile={showProfile} onStartConversation={startConversationWithUser} />
        )}

        {/* FOLLOWERS PAGE */}
        {view === "followers" && (
          <FollowersList
            token={token}
            currentUserId={user?._id}
            onShowProfile={showProfile}
            onOpenConversation={openConversation}
          />
        )}

        {/* FOLLOWING PAGE */}
        {view === "following" && (
          <FollowingList
            token={token}
            currentUserId={user?._id}
            onShowProfile={showProfile}
            onOpenConversation={openConversation}
          />
        )}

        {/* ALL USERS PAGE */}
        {view === "all-users" && (
          <AllUsers
            token={token}
            currentUserId={user?._id}
            onOpenConversation={(c) => openConversation(c)}
            onShowProfile={showProfile}
          />
        )}

        {/* ROOMS PAGE */}
        {view === "posts" && (
          <Posts
            token={token}
            currentUserId={user?._id}
            onShowProfile={(u: any) => showProfile(u)}
          />
        )}

        {/* DIRECT MESSAGES PAGE */}
        {view === "direct-messages" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">💬 Direct Messages</h2>
            <ConversationsList
              key={conversationRefreshKey}
              token={token}
              currentUserId={user?._id}
              onShowProfile={(u: any) => showProfile(u)}
              onOpenConversation={(c: any) => openConversation(c)}
              onlineUsers={onlineUsers}
            />
          </div>
        )}

        {/* CHAT / DM PAGE */}
        {view === "chat" && (
          <div className="h-full grid grid-rows-[auto_1fr_auto]">
            <header className="flex items-center justify-between p-4 border-b relative z-10" style={{ borderColor: 'var(--border)', overflow: 'visible' }}>
              {inDM && activeConversation ? (
                <div className="flex items-center gap-3">
                  {(() => {
                    const partner = (activeConversation.participants || []).find(
                      (p: any) => String(p._id) !== String(user?._id)
                    );
                    return (
                      <>
                        <div className="relative">
                          <Avatar
                            src={makeAvatarUrl(partner?.avatar)}
                            className="w-10 h-10 rounded-md object-cover"
                            alt={partner?.username || "User"}
                          />
                          {/* Online status indicator */}
                          {partner?._id && onlineUsers.has(partner._id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {partner?.username}
                            </span>
                            {partner?._id && onlineUsers.has(partner._id) && (
                              <span className="text-xs text-green-500 font-medium">● Online</span>
                            )}
                          </div>
                          {/* Show typing indicator for this specific user */}
                          {partner?._id && typingUsers[partner._id] ? (
                            <div className="flex items-center gap-1.5 text-cyan-500 text-xs">
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-1 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                              <span>typing...</span>
                            </div>
                          ) : (
                            <div className="text-xs opacity-70">
                              Private conversation
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <h3 className="text-lg font-semibold">#{room}</h3>
              )}

              <div className="text-sm opacity-80 flex items-center gap-2">
                {Object.keys(typingUsers).length > 0 && (
                  <div className="flex items-center gap-1.5 text-cyan-500 animate-pulse">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs font-medium">
                      {Object.keys(typingUsers).length === 1
                        ? `${Object.values(typingUsers)[0]?.username || 'Someone'} is typing...`
                        : Object.keys(typingUsers).length === 2
                        ? `${Object.values(typingUsers).map((u: any) => u?.username || 'Someone').join(' and ')} are typing...`
                        : `${Object.keys(typingUsers).length} people are typing...`
                      }
                    </span>
                  </div>
                )}
                {unreadIndex >= 0 && (
                  <button
                    className="text-xs px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-medium transition-all shadow-sm"
                    onClick={jumpToUnread}
                  >
                    Jump to unread
                  </button>
                )}
                
                {/* Settings Dropdown */}
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-all shadow-sm flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />
                    Settings
                  </Menu.Button>
                  
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg shadow-2xl focus:outline-none bg-slate-900 border border-slate-700 text-white" style={{ zIndex: 9999 }}>
                      <div className="py-1">
                        {/* Enter Key Toggle */}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={toggleEnterToSend}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <Zap className={clsx('w-4 h-4', enterToSend ? 'text-green-500' : 'text-gray-400')} />
                              <div className="flex-1">
                                <div className="font-medium">Send on Enter</div>
                                <div className="text-xs opacity-70">
                                  {enterToSend ? 'Enabled (Press Enter)' : 'Disabled (Press Ctrl+Enter)'}
                                </div>
                              </div>
                              <div className={clsx(
                                'w-10 h-5 rounded-full transition-colors relative',
                                enterToSend ? 'bg-green-500' : 'bg-gray-400'
                              )}>
                                <div className={clsx(
                                  'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
                                  enterToSend ? 'left-5' : 'left-0.5'
                                )} />
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                        
                        <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                        
                        {/* Clear Chat */}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={async () => {
                                if (!confirm("Clear all messages in this chat? This cannot be undone.")) return;
                                
                                try {
                                  if (inDM && activeConversation) {
                                    await axios.delete(
                                      `${API}/api/conversations/${activeConversation._id}/messages`,
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                  } else {
                                    await axios.delete(
                                      `${API}/api/messages/room/${room}/clear`,
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );
                                  }
                                  setMessages([]);
                                } catch (e) {
                                  console.error("Clear chat error", e);
                                  alert("Failed to clear chat");
                                }
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4 text-orange-500" />
                              <div>
                                <div className="font-medium">Clear Chat</div>
                                <div className="text-xs opacity-70">Remove all messages</div>
                              </div>
                            </button>
                          )}
                        </Menu.Item>
                        
                        {/* Delete Conversation (DM only) */}
                        {inDM && activeConversation && (
                          <>
                            <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={async () => {
                                    if (!confirm("Delete this entire conversation permanently? This cannot be undone.")) return;
                                    
                                    try {
                                      await axios.delete(
                                        `${API}/api/conversations/${activeConversation._id}`,
                                        { headers: { Authorization: `Bearer ${token}` } }
                                      );
                                      setActiveConversation(null);
                                      setInDM(false);
                                      setMessages([]);
                                      setView("direct-messages");
                                      
                                      // Refresh conversations list
                                      const res = await axios.get(`${API}/api/conversations`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      setConversations(res.data || []);
                                    } catch (e) {
                                      console.error("Delete conversation error", e);
                                      alert("Failed to delete conversation");
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                  <div>
                                    <div className="font-medium text-red-500">Delete Conversation</div>
                                    <div className="text-xs opacity-70">Permanently remove chat</div>
                                  </div>
                                </button>
                              )}
                            </Menu.Item>
                          </>
                        )}
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </header>

            {/* MESSAGE LIST */}
            <section 
              ref={messagesSectionRef}
              className="overflow-y-auto p-4 relative"
              onScroll={handleScroll}
            >
              <div className="flex flex-col gap-4">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="fixed bottom-24 right-8 bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all z-10"
                  title="Scroll to bottom"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </section>

            {/* MESSAGE COMPOSER */}
            <form
              className="composer flex flex-col gap-2 p-4 border-t"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
              onSubmit={sendMessage}
            >
              {/* Image Preview Bar */}
              {selectedImages.length > 0 && (
                <div className="flex gap-2 p-2 bg-slate-800/30 rounded-md overflow-x-auto">
                  {selectedImages.map((img, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-md cursor-pointer"
                        onClick={() => setImagePreviewOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <textarea
                  className="input w-full pt-3 pl-3 pr-3 pb-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-600 resize-none overflow-y-auto overflow-x-hidden leading-6"
                  style={{ 
                    minHeight: '48px',
                    maxHeight: '144px',
                    height: '48px'
                  }}
                  wrap="soft"
                  value={text}
                  onChange={onComposerChange}
                  onKeyDown={handleKeyPress}
                  placeholder={inDM ? (enterToSend ? "Message... (Enter to send)" : "Message... (Ctrl+Enter to send)") : (enterToSend ? "Say something... (Enter to send)" : "Say something... (Ctrl+Enter to send)")}
                  rows={1}
                  onInput={(e: any) => {
                    // Auto-resize textarea as user types - expand when scrollHeight exceeds current height
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = '48px';
                    if (target.scrollHeight > 48) {
                      target.style.height = Math.min(target.scrollHeight, 144) + 'px';
                    }
                  }}
                />
                <div className="flex items-center justify-end gap-2">
                  {/* Image Button with Icon */}
                  <label className="cursor-pointer p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-600 dark:text-slate-400"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>

                  <button 
                    className="p-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:shadow-lg transition-all" 
                    type="submit"
                    title="Send message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ---------------- PROFILE MODAL - MODERNIZED ---------------- */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-cyan-500/30 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
                <p className="text-gray-400 mt-4">Loading profile...</p>
              </div>
            ) : profileUser ? (
              <>
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-6 text-center">
                  <Avatar
                    src={makeAvatarUrl(profileUser.avatar)}
                    className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-white/20 shadow-xl"
                    alt={profileUser.username || "User"}
                  />
                  <h2 className="text-2xl font-bold text-white mt-4">
                    {profileUser.username}
                  </h2>
                  <p className="text-cyan-100 text-sm mt-1">
                    {profileUser.email}
                  </p>
                </div>

                {/* Stats Section */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                      <div className="text-3xl font-bold text-cyan-400">
                        {profileFollowersCount ?? 0}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">Followers</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                      <div className="text-3xl font-bold text-purple-400">
                        {profileFollowingCount ?? 0}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">Following</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {profileUser._id === user?._id ? (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
                      <p className="text-cyan-400 text-sm">
                        This is your profile
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Follow/Unfollow Button */}
                      <button
                        onClick={toggleFollowProfile}
                        className={`w-full py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${
                          profileIsFollowed
                            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                            : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                        }`}
                      >
                        {profileIsFollowed ? "✓ Following" : "+ Follow"}
                      </button>

                      {/* Message Button */}
                      <button
                        onClick={messageFromProfile}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all"
                      >
                        💬 Message
                      </button>
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
                    onClick={() => setProfileOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="text-red-400 text-5xl mb-4">⚠️</div>
                <p className="text-gray-300">Profile not available</p>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- IMAGE PREVIEW MODAL ---------------- */}
      {imagePreviewOpen && selectedImages.length > 0 && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setImagePreviewOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedImages.length} Image{selectedImages.length > 1 ? "s" : ""} Selected
              </h3>
              <button
                onClick={() => setImagePreviewOpen(false)}
                className="text-2xl opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => removeImage(idx)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={clearAllImages}
                className="px-4 py-2 border rounded-md"
              >
                Clear All
              </button>
              <button
                onClick={() => setImagePreviewOpen(false)}
                className="btn px-4 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Assistant Widget */}
      <AssistantWidget token={token} user={user as any} />
    </div>
  );
}
