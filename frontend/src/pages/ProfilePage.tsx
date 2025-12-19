import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  isFollowed: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onMessage: () => void;
}

export default function ProfileModal({
  user,
  isOpen,
  onClose,
  isFollowed,
  onFollow,
  onUnfollow,
  onMessage,
}: Props) {
  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 14 }}
          className="shadow-xl w-[380px] rounded-xl p-7"
          style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <img
              src={user.avatar || "/default.png"}
              className="w-24 h-24 rounded-xl object-cover shadow border border-gray-300 dark:border-gray-700"
            />
            <h2 className="mt-4 text-xl font-semibold">{user.username}</h2>
            <p className="text-xs opacity-70">{user.email}</p>
          </div>

          {/* Followers / Following */}
          <div className="flex justify-center gap-10 mt-6">
            <div className="text-center">
              <p className="text-xl font-bold">{user.followersCount}</p>
              <p className="text-xs opacity-70">Followers</p>
            </div>

            <div className="text-center">
              <p className="text-xl font-bold">{user.followingCount}</p>
              <p className="text-xs opacity-70">Following</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={onMessage}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-medium shadow hover:opacity-90"
            >
              Message
            </button>

            {isFollowed ? (
              <button
                onClick={onUnfollow}
                className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Unfollow
              </button>
            ) : (
              <button
                onClick={onFollow}
                className="px-5 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
              >
                Follow
              </button>
            )}
          </div>

          {/* Close */}
          <div className="mt-5 text-center">
            <button
              className="text-xs opacity-60 hover:opacity-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
