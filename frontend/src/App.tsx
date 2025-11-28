// frontend/src/App.tsx
import React, { useEffect, useState, useRef, Fragment } from "react";
import { socket } from "./socket";
import axios from "axios";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import clsx from "clsx";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StatusPicker from "./components/StatusPicker";
import SearchUsers from "./components/SearchUsers";
import ConversationsList from "./components/ConversationsList";
import AllUsers from "./pages/AllUsers";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import Avatar from "./components/Avatar";
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
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

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
  const [room, setRoom] = useState<string>("general");
  const [rooms] = useState<string[]>(["general", "random", "dev"]);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  // STATUS ------------------------------------
  const [statuses, setStatuses] = useState<Record<string, any>>({});

  // UI refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const unreadRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  // DM & conversations
  const [conversations, setConversations] = useState<any[]>([]);
  const [inDM, setInDM] = useState(false);
  const [activeConversation, setActiveConversation] = useState<any | null>(null);

  // dynamic pages
  const [view, setView] = useState<
    "chat" | "all-users" | "followers" | "following"
  >("chat");

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

  // SIDEBAR COUNTS
  const [sidebarFollowers, setSidebarFollowers] = useState<number | null>(
    null
  );
  const [sidebarFollowing, setSidebarFollowing] = useState<number | null>(
    null
  );

  // DM collapse
  const [dmOpen, setDmOpen] = useState<boolean>(true);

  // Missing states and helpers added
const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
const [unreadIndex, setUnreadIndex] = useState<number>(-1);

function shouldShowAvatar(index: number) {
  if (index === 0) return true;
  return (
    messages[index - 1]?.sender?._id !== messages[index]?.sender?._id
  );
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
  setStatuses((s) => ({ ...s, [uid]: newStatus }));
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
    socket.emit("join_room", room);

    socket.on("receive_message", (msg: any) => {
      setMessages((m) => [...m, msg]);
      scrollToBottom();
    });

    socket.on("reaction_update", (msg: any) => {
      setMessages((m) => m.map((x) => (x._id === msg._id ? msg : x)));
    });

    socket.on("typing", ({ userId, typing }: any) => {
      setTypingUsers((t) => ({ ...t, [userId]: typing }));
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
  }, [token, user, room]);

  // LOAD ROOM MESSAGES ------------------------------------------
  useEffect(() => {
    if (!token || inDM || view !== "chat") return;

    axios
      .get(API + "/api/messages/" + room, {
        headers: { Authorization: "Bearer " + token }
      })
      .then((r) => setMessages(r.data || []))
      .catch(() => {});
  }, [room, token, view, inDM]);

  // LOAD DM MESSAGES --------------------------------------------
  useEffect(() => {
    if (!token || !inDM || !activeConversation) return;

    axios
      .get(
        API + "/api/conversations/" + activeConversation._id + "/messages",
        { headers: { Authorization: "Bearer " + token } }
      )
      .then((r) => setMessages(r.data || []))
      .catch((e) => console.error("DM load error", e));
  }, [token, inDM, activeConversation]);

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

  // LOAD SIDEBAR FOLLOWERS / FOLLOWING ---------------------------
  useEffect(() => {
    if (!token) return;

    axios
      .get(API + "/api/users/me", {
        headers: { Authorization: "Bearer " + token }
      })
      .then((res) => {
        const u = res.data;

        setSidebarFollowers(
          Array.isArray(u.followers) ? u.followers.length : 0
        );
        setSidebarFollowing(
          Array.isArray(u.following) ? u.following.length : 0
        );
      })
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
    scrollToBottom();
  }

  // TYPING -------------------------------------------------------
  function onComposerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);

    socket.emit("typing", {
      room: inDM && activeConversation ? activeConversation._id : room,
      userId: user?._id,
      typing: !!e.target.value
    });
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
      socket.emit("join_room", conv._id || conv.id);
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
                {["❤️", "🔥", "😂"].map((emoji) => (
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
      const res = await axios.post(API + "/api/users/avatar", fd, {
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data?.user) {
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
    <div className="layout container flex gap-4 p-4 min-h-screen">
      {/* ---------------- SIDEBAR ---------------- */}
      <aside className="sidebar">
        <div>
          {/* Header / Logo / Theme toggle */}
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex flex-col items-center">
              <img
                src={logo}
                className="w-16 h-16 rounded-xl mb-2 object-cover"
                alt="logo"
              />
              <h2 className="text-xl font-bold">BANJA</h2>
            </div>

            <button
              className="p-2 rounded-lg border border-slate-600 hover:bg-slate-700/40"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>

          {/* CURRENT USER */}
          <div className="flex items-center gap-3">
            <Avatar
              src={makeAvatarUrl(user?.avatar)}
              className="w-14 h-14 rounded-md object-cover"
              alt={user?.username || "User"}
            />
            <div>
              <div className="font-bold">{user?.username}</div>
              <div className="text-sm opacity-70">{user?.email}</div>

              {myStatus && (
                <div className="text-xs mt-1 flex gap-1 items-center">
                  <span>{myStatus.emoji}</span>
                  <span className="opacity-80">{myStatus.mood}</span>
                </div>
              )}
            </div>
          </div>

          {/* STATUS PICKER */}
          <div className="mt-4">
            <StatusPicker
              token={token}
              currentStatus={myStatus}
              onUpdated={onMyStatusUpdated}
            />
          </div>

          {/* USERS / FOLLOWERS / FOLLOWING */}
          <div className="mt-4 p-2">
            <button
              className="w-full text-left px-2 py-2 rounded-md hover:bg-slate-800/40"
              onClick={() => {
                setView("all-users");
                setInDM(false);
                setActiveConversation(null);
              }}
            >
              📋 All Users
            </button>

            <div className="mt-3 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Followers:</span>
                <span className="font-semibold">{sidebarFollowers ?? "—"}</span>
              </div>

              <div className="flex justify-between mt-1">
                <span className="opacity-70">Following:</span>
                <span className="font-semibold">{sidebarFollowing ?? "—"}</span>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  className="px-2 py-1 border rounded-md text-sm"
                  onClick={() => setView("followers")}
                >
                  View Followers
                </button>
                <button
                  className="px-2 py-1 border rounded-md text-sm"
                  onClick={() => setView("following")}
                >
                  View Following
                </button>
              </div>
            </div>
          </div>

          {/* AVATAR UPLOAD */}
          <div className="mt-4">
            <label className="block text-sm mb-2">Change Profile</label>
            <input type="file" accept="image/*" onChange={uploadAvatarDirect} />

            {selectedAvatar && (
              <div className="flex gap-2 mt-2">
                <button className="btn" onClick={saveAvatar}>
                  Save
                </button>
                <button
                  className="px-3 py-2 border rounded-md"
                  onClick={() => setSelectedAvatar(null)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* ROOMS */}
          <div className="mt-6">
            <button
              className="w-full text-left px-2 py-2 rounded-md hover:bg-slate-800/40 font-semibold"
              onClick={() => {
                setView("rooms");
                setInDM(false);
                setActiveConversation(null);
              }}
            >
              🏠 Rooms
            </button>
          </div>

          {/* DIRECT MESSAGES */}
          <div className="mt-6">
            <button
              className="w-full text-left px-2 py-2 rounded-md hover:bg-slate-800/40 flex items-center justify-between font-semibold"
              onClick={() => {
                setView("direct-messages");
                setInDM(false);
                setActiveConversation(null);
              }}
            >
              <span>💬 Direct Messages</span>
              <span className="text-xs opacity-60">
                ({conversations.length})
              </span>
            </button>
          </div>

          {/* SEARCH USERS */}
          <div className="mt-4 px-2">
            <SearchUsers
              token={token}
              currentUserId={user?._id}
              onShowProfile={(u: any) => showProfile(u)}
              onOpenConversation={(c: any) => openConversation(c)}
            />
          </div>
        </div>

        {/* LOGOUT */}
        <button className="btn w-full mt-6" onClick={logout}>
          Log Out
        </button>
      </aside>

      {/* ---------------- MAIN VIEW ---------------- */}
      <main className="main flex-1 flex flex-col">
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
            <h2 className="text-2xl font-bold mb-6">🏠 Rooms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((r) => (
                <button
                  key={r}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-all text-left"
                  onClick={() => {
                    setRoom(r);
                    setInDM(false);
                    setView("chat");
                  }}
                >
                  <div className="text-xl font-bold mb-2">#{r}</div>
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
          <>
            <header className="flex items-center justify-between mb-4">
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

              <div className="text-sm opacity-80 flex items-center gap-3">
                {Object.values(typingUsers).some(Boolean)
                  ? "Someone is typing..."
                  : ""}
                {unreadIndex >= 0 && (
                  <button
                    className="text-xs px-3 py-1 bg-cyan-500 rounded-full text-white"
                    onClick={jumpToUnread}
                  >
                    Jump to unread
                  </button>
                )}
              </div>
            </header>

            {/* MESSAGE LIST */}
            <section className="flex-1 overflow-auto p-2">
              <div className="flex flex-col gap-4">
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
            </section>

            {/* MESSAGE COMPOSER */}
            <form
              className="composer mt-4 flex flex-col gap-2"
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

              <div className="relative flex items-center">
                <input
                  className="input w-full p-3 pr-24 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-300 dark:border-slate-600"
                  value={text}
                  onChange={onComposerChange}
                  placeholder={inDM ? "Message..." : "Say something..."}
                />
                
                <div className="absolute right-2 flex items-center gap-1">
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
          </>
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
