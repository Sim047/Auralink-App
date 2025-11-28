// frontend/src/pages/AllUsers.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Avatar from "../components/Avatar";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";

type User = {
  _id: string;
  username?: string;
  email?: string;
  avatar?: string;
  isFollowed?: boolean;
};

export default function AllUsers({ token, onOpenConversation, currentUserId }: any) {

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [listMode, setListMode] = useState<"grid" | "list">("grid");

  // Profile Modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Image Preview Modal
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewUsername, setPreviewUsername] = useState("");

  const [followList, setFollowList] = useState<any[]>([]);
  const [followListMode, setFollowListMode] = useState<"followers" | "following">(
    "followers"
  );
  const [followListLoading, setFollowListLoading] = useState(false);

  /* ----------------------------------------------------------
     LOAD USERS
  ----------------------------------------------------------- */
  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [token]);

  async function loadUsers(q = "") {
    try {
      setLoading(true);

      const url =
        API + "/api/users/all" + (q ? "?search=" + encodeURIComponent(q) : "");

      const res = await axios.get(url, {
        headers: { Authorization: "Bearer " + token },
      });

      const normalized = (res.data || []).map((u: any) => ({
        ...(u || {}),
        isFollowed: !!u.isFollowed,
      }));

      setUsers(normalized);
    } catch (err) {
      console.error("AllUsers load err", err);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------------------------------------
     SEARCH (debounced)
  ----------------------------------------------------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      if (!token) return;
      loadUsers(search);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  /* ----------------------------------------------------------
     UTIL: Avatar Url
  ----------------------------------------------------------- */
  function avatarUrl(u: any) {
    if (!u?.avatar) return PLACEHOLDER;
    if (u.avatar.startsWith("http")) return u.avatar;
    if (u.avatar.startsWith("/")) return API + u.avatar;
    return API + "/uploads/" + u.avatar;
  }

  /* ----------------------------------------------------------
     START CONVERSATION
  ----------------------------------------------------------- */
  async function startConversation(user: User) {
    if (!token) return;

    setProcessingId(user._id);

    try {
      const res = await axios.post(
        API + "/api/users/conversations/start",
        { partnerId: user._id },
        { headers: { Authorization: "Bearer " + token } }
      );

      onOpenConversation(res.data);
    } catch (err) {
      console.error("startConversation error", err);
      alert("Could not start chat");
    } finally {
      setProcessingId(null);
    }
  }

  /* ----------------------------------------------------------
     FOLLOW / UNFOLLOW
  ----------------------------------------------------------- */
  async function followToggle(user: User, follow: boolean) {
    if (!token) return;

    setProcessingId(user._id);

    try {
      const url = `${API}/api/users/${user._id}/${follow ? "follow" : "unfollow"}`;

      await axios.post(
        url,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isFollowed: follow } : u
        )
      );
    } catch (err) {
      console.error("followToggle error", err);
    } finally {
      setProcessingId(null);
    }
  }

  /* ----------------------------------------------------------
     OPEN PROFILE
  ----------------------------------------------------------- */
  async function openProfile(userId: string) {
    setProfileOpen(true);
    setProfileLoading(true);

    try {
      const res = await axios.get(API + "/api/users/" + userId, {
        headers: { Authorization: "Bearer " + token },
      });

      setProfileUser(res.data);
    } catch (err) {
      console.error("openProfile err", err);
      setProfileUser(null);
    } finally {
      setProfileLoading(false);
    }
  }

  /* ----------------------------------------------------------
     PREVIEW IMAGE
  ----------------------------------------------------------- */
  function previewImage(user: User) {
    setPreviewImageUrl(avatarUrl(user));
    setPreviewUsername(user.username || "User");
    setImagePreviewOpen(true);
  }

  /* ----------------------------------------------------------
     FETCH FOLLOW LIST
  ----------------------------------------------------------- */
  async function fetchFollowList(userId: string, which: "followers" | "following") {
    try {
      const res = await axios.get(API + `/api/users/${userId}/${which}`, {
        headers: { Authorization: "Bearer " + token },
      });
      return res.data || [];
    } catch (err) {
      console.error("fetchFollowList err", err);
      return [];
    }
  }

  async function viewFollowList(which: "followers" | "following") {
    if (!profileUser) return;
    setFollowListMode(which);
    setFollowListLoading(true);

    const items = await fetchFollowList(profileUser._id, which);

    setFollowList(items);
    setFollowListLoading(false);
  }

  /* ==========================================================
     RENDER
  =========================================================== */

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold">📋 All Users</h2>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="input w-full sm:w-64 pl-10 pr-4 py-2 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <select
            value={listMode}
            onChange={(e) => setListMode(e.target.value as any)}
            className="input px-4 py-2 rounded-md"
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>
      </div>

      {/* USERS */}
      {loading ? (
        <div className="text-slate-600 dark:text-slate-400">Loading users…</div>
      ) : users.length === 0 ? (
        <div className="text-slate-600 dark:text-slate-400 text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <div>{search ? `No users found matching "${search}"` : "No users found."}</div>
        </div>
      ) : listMode === "grid" ? (
        /* -------------------- GRID MODE -------------------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {users.map((u) => (
            <div
              key={u._id}
              className="
                bg-white dark:bg-slate-800
                rounded-xl border border-gray-200 dark:border-gray-700
                p-5 flex flex-col items-center text-center 
                shadow-sm hover:shadow-lg transition-all
                min-h-[280px]
              "
            >
              {/* Avatar */}
              <div className="relative group mb-3 flex-shrink-0">
                <Avatar
                  src={avatarUrl(u)}
                  className="w-20 h-20 rounded-lg object-cover cursor-pointer transition-transform group-hover:scale-105"
                  onClick={() => previewImage(u)}
                  alt={u.username}
                />
                <div 
                  className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  onClick={() => previewImage(u)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>

              {/* Username */}
              <div
                className="mt-1 font-semibold cursor-pointer truncate w-full text-slate-900 dark:text-slate-100"
                onClick={() => openProfile(u._id)}
              >
                {u.username}
              </div>

              {/* Email */}
              <div className="text-xs text-slate-600 dark:text-slate-400 truncate w-full mb-4">
                {u.email}
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2 mt-auto w-full">
                <button
                  className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-medium hover:shadow-md transition-shadow"
                  onClick={() => startConversation(u)}
                  disabled={processingId === u._id}
                >
                  {processingId === u._id ? "..." : "Message"}
                </button>

                {u._id !== currentUserId && (
                  <button
                    className="w-full px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    onClick={() => followToggle(u, !u.isFollowed)}
                    disabled={processingId === u._id}
                  >
                    {u.isFollowed ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* -------------------- LIST MODE -------------------- */
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <div
              key={u._id}
              className="
                flex items-center justify-between 
                p-3 rounded-lg 
                bg-slate-200 dark:bg-slate-800
                border border-gray-300 dark:border-gray-700
              "
            >
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Avatar
                    src={avatarUrl(u)}
                    className="w-12 h-12 rounded-md object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => previewImage(u)}
                    alt={u.username}
                  />
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => previewImage(u)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                </div>

                <div>
                  <div
                    className="font-bold cursor-pointer"
                    onClick={() => openProfile(u._id)}
                  >
                    {u.username}
                  </div>
                  <div className="text-xs opacity-60">{u.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white"
                  onClick={() => startConversation(u)}
                >
                  Chat
                </button>

                {u._id !== currentUserId && (
                  <button
                    className="px-3 py-1 rounded-md bg-gray-300 dark:bg-gray-700 text-black dark:text-white"
                    onClick={() => followToggle(u, !u.isFollowed)}
                  >
                    {u.isFollowed ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------------
         IMAGE PREVIEW MODAL
      ------------------------------------------------------------------- */}
      {imagePreviewOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/80"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
              onClick={() => setImagePreviewOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            
            <img
              src={previewImageUrl}
              alt={previewUsername}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
              <p className="text-white text-lg font-semibold">{previewUsername}</p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
         PROFILE MODAL (works with your new dark/light theme)
      ------------------------------------------------------------------- */}
      {profileOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setProfileOpen(false)}
          />

          <div className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl p-6 w-full max-w-md shadow-2xl">

            {profileLoading ? (
              <div className="text-slate-900 dark:text-slate-100">Loading profile…</div>
            ) : !profileUser ? (
              <div className="text-slate-900 dark:text-slate-100">Profile unavailable</div>
            ) : (
              <>
                {/* Avatar and main info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative group flex-shrink-0">
                    <Avatar
                      src={avatarUrl(profileUser)}
                      className="w-20 h-20 rounded-lg object-cover cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => previewImage(profileUser)}
                      alt={profileUser.username}
                    />
                    <div 
                      className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={() => previewImage(profileUser)}
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
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{profileUser.username}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{profileUser.email}</div>

                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                      <div>Followers: <b className="text-slate-900 dark:text-slate-100">{profileUser.followersCount}</b></div>
                      <div>Following: <b className="text-slate-900 dark:text-slate-100">{profileUser.followingCount}</b></div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-medium hover:shadow-md transition-shadow"
                    onClick={() => startConversation(profileUser)}
                  >
                    Message
                  </button>
                  
                  {profileUser._id !== currentUserId && (
                    <button
                      className="w-full px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      onClick={() =>
                        followToggle(profileUser, !profileUser.isFollowed)
                      }
                    >
                      {profileUser.isFollowed ? "Unfollow" : "Follow"}
                    </button>
                  )}

                  <button
                    className="w-full px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
