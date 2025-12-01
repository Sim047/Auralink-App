// frontend/src/pages/AllUsersModern.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  Search, 
  MessageCircle, 
  UserPlus, 
  UserMinus, 
  X, 
  Grid,
  List,
  Filter,
  Star
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

type User = {
  _id: string;
  username?: string;
  email?: string;
  avatar?: string;
  isFollowed?: boolean;
  bio?: string;
  sport?: string;
  followers?: number;
  following?: number;
};

export default function AllUsersModern({ token, onOpenConversation, currentUserId, onShowProfile }: any) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [token]);

  async function loadUsers(q = "") {
    try {
      setLoading(true);

      const url = `${API}/api/users/all${q ? "?search=" + encodeURIComponent(q) : ""}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    const t = setTimeout(() => {
      if (!token) return;
      loadUsers(search);
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  function avatarUrl(u: any) {
    if (!u?.avatar) return `https://ui-avatars.com/api/?name=${u?.username || 'User'}&background=0D8ABC&color=fff`;
    if (u.avatar.startsWith("http")) return u.avatar;
    if (u.avatar.startsWith("/")) return API + u.avatar;
    return API + "/uploads/" + u.avatar;
  }

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
    } finally {
      setProcessingId(null);
    }
  }

  async function followToggle(user: User, follow: boolean) {
    if (!token) return;
    setProcessingId(user._id);

    try {
      const url = `${API}/api/users/${user._id}/${follow ? "follow" : "unfollow"}`;

      await axios.post(url, {}, { headers: { Authorization: "Bearer " + token } });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#071029]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              All Users
            </h1>
            
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-teal-500 dark:text-white placeholder-gray-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-4`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-16" />
                  </div>
                </div>
                <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-4`}>
            {users.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                viewMode={viewMode}
                avatarUrl={avatarUrl(user)}
                onMessage={() => startConversation(user)}
                onFollow={() => followToggle(user, !user.isFollowed)}
                onViewProfile={() => onShowProfile && onShowProfile(user)}
                isProcessing={processingId === user._id}
                isCurrentUser={user._id === currentUserId}
              />
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// User Card Component
function UserCard({
  user,
  viewMode,
  avatarUrl,
  onMessage,
  onFollow,
  onViewProfile,
  isProcessing,
  isCurrentUser,
}: any) {
  if (viewMode === "list") {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={user.username}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-500/20 cursor-pointer"
            onClick={onViewProfile}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-teal-500"
                onClick={onViewProfile}
              >
                {user.username}
              </h3>
              {user.verified && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {user.bio || user.email || "No bio"}
            </p>
          </div>

          {!isCurrentUser && (
            <div className="flex gap-2">
              <button
                onClick={onMessage}
                disabled={isProcessing}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
                title="Send message"
              >
                <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <button
                onClick={onFollow}
                disabled={isProcessing}
                className={`p-2.5 rounded-lg transition disabled:opacity-50 ${
                  user.isFollowed
                    ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    : "bg-teal-500 hover:bg-teal-600"
                }`}
                title={user.isFollowed ? "Unfollow" : "Follow"}
              >
                {user.isFollowed ? (
                  <UserMinus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <UserPlus className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all group">
      <div className="flex flex-col items-center text-center">
        <img
          src={avatarUrl}
          alt={user.username}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-teal-500/20 mb-3 cursor-pointer group-hover:scale-105 transition"
          onClick={onViewProfile}
        />

        <div className="flex items-center gap-2 mb-1">
          <h3 
            className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-teal-500"
            onClick={onViewProfile}
          >
            {user.username}
          </h3>
          {user.verified && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>

        {user.sport && (
          <p className="text-xs text-teal-600 dark:text-teal-400 mb-2">
            {user.sport}
          </p>
        )}

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {user.bio || user.email || "No bio available"}
        </p>

        {(user.followers !== undefined || user.following !== undefined) && (
          <div className="flex gap-4 mb-4 text-xs">
            {user.followers !== undefined && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.followers}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  Followers
                </span>
              </div>
            )}
            {user.following !== undefined && (
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {user.following}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  Following
                </span>
              </div>
            )}
          </div>
        )}

        {!isCurrentUser && (
          <div className="flex gap-2 w-full">
            <button
              onClick={onMessage}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
            
            <button
              onClick={onFollow}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                user.isFollowed
                  ? "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }`}
            >
              {user.isFollowed ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
