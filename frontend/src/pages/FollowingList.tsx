import React, { useEffect, useState } from "react";
import axios from "axios";
import Avatar from "../components/Avatar";

const API = import.meta.env.VITE_API_URL || "";

export default function FollowingList({
  token,
  currentUserId,
  onShowProfile,
  onOpenConversation,
}: any) {
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listMode, setListMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!token || !currentUserId) return;
    axios
      .get(`${API}/api/users/${currentUserId}`, {
        headers: { Authorization: "Bearer " + token },
      })
      .then((res) => setFollowing(res.data.following || []))
      .finally(() => setLoading(false));
  }, [token, currentUserId]);

  function avatarUrl(u: any) {
    if (!u?.avatar) return "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";
    if (u.avatar.startsWith("http")) return u.avatar;
    if (u.avatar.startsWith("/")) return API + u.avatar;
    return API + "/uploads/" + u.avatar;
  }

  async function toggleFollow(u: any) {
    const route = u.isFollowed ? "unfollow" : "follow";

    await axios.post(
      `${API}/api/users/${u._id}/${route}`,
      {},
      { headers: { Authorization: "Bearer " + token } }
    );

    setFollowing((prev) =>
      prev.map((x) =>
        x._id === u._id ? { ...x, isFollowed: !u.isFollowed } : x
      )
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">➕ Following</h2>
        
        <select
          value={listMode}
          onChange={(e) => setListMode(e.target.value as any)}
          className="input px-4 py-2 rounded-md"
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>

      {loading ? (
        <div className="text-slate-600 dark:text-slate-400">Loading…</div>
      ) : following.length === 0 ? (
        <div className="text-slate-600 dark:text-slate-400 text-center py-12">
          <div className="text-4xl mb-3">➕</div>
          <div>Not following anyone yet.</div>
        </div>
      ) : listMode === "grid" ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {following.map((u) => (
            <div
              key={u._id}
              className="rounded-xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all min-h-[280px]"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Avatar
                src={avatarUrl(u)}
                className="w-20 h-20 rounded-lg object-cover cursor-pointer mb-3 flex-shrink-0"
                onClick={() => onShowProfile(u)}
                alt={u.username}
              />

              <div
                className="mt-1 font-semibold cursor-pointer truncate w-full text-slate-900 dark:text-slate-100"
                onClick={() => onShowProfile(u)}
              >
                {u.username}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 truncate w-full mb-4">
                {u.email}
              </div>

              <div className="flex flex-col gap-2 mt-auto w-full">
                <button
                  onClick={() => onOpenConversation({ partnerId: u._id })}
                  className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-medium hover:shadow-md transition-shadow"
                >
                  Message
                </button>

                <button
                  onClick={() => toggleFollow(u)}
                  className="w-full px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST MODE */
        <div className="flex flex-col gap-3">
          {following.map((u) => (
            <div
              key={u._id}
              className="flex items-center gap-3 p-4 rounded-xl hover:shadow-md transition-all flex-wrap sm:flex-nowrap"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <Avatar
                src={avatarUrl(u)}
                className="w-14 h-14 rounded-lg object-cover cursor-pointer flex-shrink-0"
                onClick={() => onShowProfile(u)}
                alt={u.username}
              />

              <div
                className="flex-1 cursor-pointer min-w-0"
                onClick={() => onShowProfile(u)}
              >
                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{u.username}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 truncate">{u.email}</div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onOpenConversation({ partnerId: u._id })}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-md bg-gradient-to-r from-cyan-400 to-purple-500 text-white text-sm font-medium hover:shadow-md transition-shadow"
                >
                  Message
                </button>

                <button
                  onClick={() => toggleFollow(u)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Unfollow
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
