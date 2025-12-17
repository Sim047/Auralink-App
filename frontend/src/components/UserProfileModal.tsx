import React from "react";
import axios from "axios";
import { X, MessageCircle, UserPlus, UserMinus } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PLACEHOLDER = "https://placehold.co/80x80?text=U";

export default function UserProfileModal({
  user,
  visible,
  onClose,
  token,
  onOpenConversation,
  currentUserId
}: any) {
  if (!visible || !user) return null;

  const [followState, setFollowState] = React.useState(user.isFollowed);
  const [details, setDetails] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token || !user) return;

    setLoading(true);
    axios
      .get(API + "/api/users/profile/" + user._id, {
        headers: { Authorization: "Bearer " + token }
      })
      .then((r) => {
        setDetails(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, token]);

  async function toggleFollow() {
    try {
      const action = followState ? "unfollow" : "follow";

      await axios.post(
        `${API}/api/users/${user._id}/${action}`,
        {},
        { headers: { Authorization: "Bearer " + token } }
      );

      setFollowState(!followState);
      
      // Update local details count
      if (details) {
        setDetails({
          ...details,
          followersCount: followState ? details.followersCount - 1 : details.followersCount + 1
        });
      }
    } catch (err) {
      console.error("follow error:", err);
    }
  }

  function avatar() {
    if (!user?.avatar) return PLACEHOLDER;
    if (user.avatar.startsWith("http")) return user.avatar;
    if (user.avatar.startsWith("/")) return API + user.avatar;
    return API + "/uploads/" + user.avatar;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl w-full max-w-md overflow-hidden border border-cyan-500/30 shadow-2xl">
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <img
            src={avatar()}
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white/20 shadow-xl"
            alt={user.username}
          />
          <h2 className="mt-4 text-2xl font-bold text-white">{user.username}</h2>
          <p className="text-cyan-100 text-sm mt-1">{user.email}</p>
        </div>

        {/* Stats & Actions Section */}
        <div className="p-6 space-y-6">
          {/* Followers / Following */}
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading stats...</div>
          ) : details ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                <div className="text-3xl font-bold text-cyan-400">
                  {details.followersCount || 0}
                </div>
                <div className="text-gray-400 text-sm mt-1">Followers</div>
              </div>

              <div className="bg-white/5 backdrop-blur rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                <div className="text-3xl font-bold text-purple-400">
                  {details.followingCount || 0}
                </div>
                <div className="text-gray-400 text-sm mt-1">Following</div>
              </div>
            </div>
          ) : null}

          {/* Action Buttons */}
          {user._id === currentUserId ? (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-center">
              <p className="text-cyan-400 text-sm">This is your profile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Follow/Unfollow Button */}
              <button
                onClick={toggleFollow}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  followState
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                    : "bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
                }`}
              >
                {followState ? (
                  <>
                    <UserMinus className="w-5 h-5" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Follow
                  </>
                )}
              </button>

              {/* Message Button */}
              <button
                onClick={() => onOpenConversation(user)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </button>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
