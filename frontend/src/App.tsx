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
import Dashboard from "./pages/Dashboard";
import MyEvents from "./pages/MyEvents";
import Avatar from "./components/Avatar";
import Sidebar from "./components/Sidebar";
import logo from "./assets/logo.png";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale("en", { weekStart: 1 });

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SAMPLE_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";

const THEME_KEY = "banja-theme";

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

  // ROOMS + DM --------------------------------
  const [room, setRoom] = useState<string>(() => {
    const saved = localStorage.getItem("banja-current-room");
    return saved || "general";
  });
  
  // Persist room changes
  useEffect(() => {
    localStorage.setItem("banja-current-room", room);
  }, [room]);
  const [rooms] = useState<string[]>(["general", "random", "dev"]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});

  // STATUS ------------------------------------
  const [statuses, setStatuses] = useState<Record<string, any>>({});

  // UI refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  // DM & conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [inDM, setInDM] = useState(() => {
    const saved = localStorage.getItem("banja-in-dm");
    return saved ? JSON.parse(saved) : false;
  });
  const [activeConversation, setActiveConversation] = useState<any | null>(() => {
    const saved = localStorage.getItem("banja-active-conversation");
    return saved ? JSON.parse(saved) : null;
  });
  
  // Persist DM state
  useEffect(() => {
    localStorage.setItem("banja-in-dm", JSON.stringify(inDM));
  }, [inDM]);
  
  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem("banja-active-conversation", JSON.stringify(activeConversation));
    } else {
      localStorage.removeItem("banja-active-conversation");
    }
  }, [activeConversation]);

  // dynamic pages
  const [view, setView] = useState<
    "dashboard" | "discover" | "chat" | "all-users" | "followers" | "following" | "rooms" | "direct-messages"
  >(() => {
    // Restore previous view from localStorage
    const saved = localStorage.getItem("banja-current-view");
    return (saved as any) || "dashboard";
  });
  
  // Persist view changes to localStorage
  useEffect(() => {
    localStorage.setItem("banja-current-view", view);
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
  try {
    await axios.put(
      API + "/api/messages/" + id,
      { text: editingText },
      { headers: { Authorization: "Bearer " + token } }
    );
    socket.emit("edit_message", { messageId: id, text: editingText });
    setEditingMessageId(null);
  } catch (e) {
    console.error("Edit failed", e);
  }
}

async function deleteMessage(id: string) {
  if (!token) return;
  try {
    await axios.delete(API + "/api/messages/" + id, {
      headers: { Authorization: "Bearer " + token }
    });
    socket.emit("delete_message", { messageId: id });
  } catch (e) {
    console.error("Delete failed", e);
  }
}

function onMyStatusUpdated(newStatus: any) {
  const uid = String(user?._id || user?.id);
  console.log("App: onMyStatusUpdated called with:", newStatus, "for user:", uid);
  setStatuses((s) => {
    const updated = { ...s, [uid]: newStatus };
    console.log("App: Updated statuses map:", updated);
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

    socket.on("receive_message", (msg: any) => {
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
        }
        
        // Show browser notification for messages from others
        if ("Notification" in window && Notification.permission === "granted") {
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
      if (typing) {
        setTypingUsers((t) => ({ ...t, [userId]: typingUser || { username: 'Someone' } }));
        
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

    socket.on("message_deleted", (id: string) => {
      setMessages((m) => m.filter((x) => x._id !== id));
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

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token, user, view]);
  
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
  }

  // TYPING -------------------------------------------------------
  function onComposerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);

    socket.emit("typing", {
      room: inDM && activeConversation ? activeConversation._id : room,
      userId: user?._id,
      user: { _id: user?._id, username: user?.username, avatar: user?.avatar },
      typing: !!e.target.value
    });
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
    }

    setProfileLoading(false);
    setProfileOpen(true);
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
  function openConversation(conv: any) {
    setActiveConversation(conv);
    setInDM(true);
    setView("chat");

    if (socket.connected) {
      const roomId = conv._id || conv.id;
      console.log("[Socket] Opening conversation, joining room:", roomId);
      socket.emit("join_room", roomId);
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
                  src={API + m.fileUrl}
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
                <div className="mt-2">{m.text}</div>
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
      <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-auto" style={{ color: 'var(--text)' }}>
        {/* DASHBOARD PAGE */}
        {view === "dashboard" && (
          <Dashboard
            token={token}
            onNavigate={(newView: string) => setView(newView as any)}
          />
        )}
        
        {/* MY EVENTS PAGE */}
        {view === "my-events" && (
          <MyEvents token={token} />
        )}
        
        {/* DISCOVER PAGE */}
        {view === "discover" && (
          <Discover
            token={token}
            onViewProfile={showProfile}
          />
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
        {view === "rooms" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">🏠 Rooms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((r) => (
                <button
                  key={r}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-cyan-400 dark:hover:border-cyan-500 transition-all text-left group"
                  onClick={() => {
                    setRoom(r);
                    setInDM(false);
                    setView("chat");
                  }}
                >
                  <div className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100 group-hover:text-cyan-500 transition-colors">#{r}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Click to join room
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DIRECT MESSAGES PAGE */}
        {view === "direct-messages" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">💬 Direct Messages</h2>
            <ConversationsList
              token={token}
              currentUserId={user?._id}
              onShowProfile={(u: any) => showProfile(u)}
              onOpenConversation={(c: any) => openConversation(c)}
            />
          </div>
        )}

        {/* CHAT / DM PAGE */}
        {view === "chat" && (
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between mb-4 flex-shrink-0">
              {inDM && activeConversation ? (
                <div className="flex items-center gap-3">
                  {(() => {
                    const partner = (activeConversation.participants || []).find(
                      (p: any) => String(p._id) !== String(user?._id)
                    );
                    return (
                      <>
                        <Avatar
                          src={makeAvatarUrl(partner?.avatar)}
                          className="w-10 h-10 rounded-md object-cover"
                          alt={partner?.username || "User"}
                        />
                        <div>
                          <div className="font-semibold">
                            {partner?.username}
                          </div>
                          <div className="text-xs opacity-70">
                            Private conversation
                          </div>
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
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}>
                      <div className="py-1">
                        {/* Enter Key Toggle */}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={toggleEnterToSend}
                              className={clsx(
                                'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
                                active ? 'bg-slate-100 dark:bg-slate-700' : ''
                              )}
                              style={{ color: 'var(--text)' }}
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
                              className={clsx(
                                'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
                                active ? 'bg-slate-100 dark:bg-slate-700' : ''
                              )}
                              style={{ color: 'var(--text)' }}
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
                                  className={clsx(
                                    'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
                                    active ? 'bg-slate-100 dark:bg-slate-700' : ''
                                  )}
                                  style={{ color: 'var(--text)' }}
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
            <section className="flex-1 overflow-y-auto p-2 min-h-0">
              <div className="flex flex-col gap-4">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
            </section>

            {/* MESSAGE COMPOSER */}
            <form
              className="composer mt-4 flex flex-col gap-2 flex-shrink-0"
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

              <div className="relative flex items-end">
                <textarea
                  className="input w-full p-3 pr-28 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-600 resize-none overflow-hidden min-h-[48px] max-h-[200px]"
                  value={text}
                  onChange={onComposerChange}
                  onKeyDown={handleKeyPress}
                  placeholder={inDM ? (enterToSend ? "Message... (Enter to send)" : "Message... (Ctrl+Enter to send)") : (enterToSend ? "Say something... (Enter to send)" : "Say something... (Ctrl+Enter to send)")}
                  rows={1}
                  onInput={(e: any) => {
                    // Auto-resize textarea as user types
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                  }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  {/* Image Button with Icon */}
                  <label className="cursor-pointer p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
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

      {/* ---------------- PROFILE MODAL ---------------- */}
      {profileOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {profileLoading ? (
              <div className="text-center p-8">Loading…</div>
            ) : profileUser ? (
              <>
                <div className="flex flex-col items-center gap-3">
                  <Avatar
                    src={makeAvatarUrl(profileUser.avatar)}
                    className="w-20 h-20 rounded-md object-cover"
                    alt={profileUser.username || "User"}
                  />
                  <div className="text-lg font-semibold">
                    {profileUser.username}
                  </div>
                  <div className="text-xs opacity-70">
                    {profileUser.email}
                  </div>
                </div>

                <div className="flex justify-around mt-4 text-center">
                  <div>
                    <div className="text-xs opacity-70">Followers</div>
                    <div className="font-semibold">
                      {profileFollowersCount ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs opacity-70">Following</div>
                    <div className="font-semibold">
                      {profileFollowingCount ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-center">
                  <button className="btn" onClick={messageFromProfile}>
                    Message
                  </button>

                  {profileUser._id !== user?._id && (
                    <button
                      className="px-3 py-2 border rounded-md"
                      onClick={toggleFollowProfile}
                    >
                      {profileIsFollowed ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <button
                    className="text-xs opacity-60"
                    onClick={() => setProfileOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center p-6">Profile not available</div>
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
    </div>
  );
}
