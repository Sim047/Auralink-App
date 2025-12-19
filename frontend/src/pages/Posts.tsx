// frontend/src/pages/Posts.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Heart, MessageCircle, Send, MoreVertical, Trash2, Edit, X, Image as ImageIcon, Plus, ArrowUp } from "lucide-react";
import { Menu } from "@headlessui/react";
import Avatar from "../components/Avatar";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const API = import.meta.env.VITE_API_URL || "";

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
    email: string;
  };
  caption: string;
  imageUrl: string;
  likes: string[];
  comments: Array<{
    _id: string;
    user: {
      _id: string;
      username: string;
      avatar?: string;
    };
    text: string;
    likes?: string[];
    replies?: Array<{
      user: {
        _id: string;
        username: string;
        avatar?: string;
      };
      text: string;
      createdAt: string;
    }>;
    createdAt: string;
  }>;
  tags: string[];
  location: string;
  createdAt: string;
  updatedAt: string;
  captionEditedAt?: string;
}

export default function Posts({ token, currentUserId, onShowProfile }: any) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({ caption: "", imageUrl: "", location: "", tags: "" });
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Edit states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostData, setEditPostData] = useState({ caption: "", location: "", tags: "" });
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  
  // Comments collapse state
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (token) loadPosts();
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }

  function makeAvatarUrl(avatar?: string) {
    if (!avatar) return "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff";
    if (avatar.startsWith("http")) return avatar;
    if (avatar.startsWith("/")) return API + avatar;
    return API + "/uploads/" + avatar;
  }

  async function handleCreatePost() {
    if (!newPost.caption.trim() && !newPost.imageUrl) {
      alert("Please add a caption or image");
      return;
    }

    try {
      const tags = newPost.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await axios.post(
        `${API}/api/posts`,
        {
          caption: newPost.caption,
          imageUrl: newPost.imageUrl,
          tags,
          location: newPost.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts([res.data, ...posts]);
      setNewPost({ caption: "", imageUrl: "", location: "", tags: "" });
      setCreateModalOpen(false);
    } catch (err) {
      console.error("Failed to create post:", err);
      alert("Failed to create post");
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API}/api/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setNewPost({ ...newPost, imageUrl: res.data.url });
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await axios.post(
        `${API}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  }

  async function handleComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;

    try {
      const res = await axios.post(
        `${API}/api/posts/${postId}/comment`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
      setCommentTexts({ ...commentTexts, [postId]: "" });
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    try {
      await axios.delete(`${API}/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPosts(posts.filter((p) => p._id !== postId));
    } catch (err) {
      console.error("Failed to delete post:", err);
      alert("Failed to delete post");
    }
  }

  function startEditPost(post: Post) {
    setEditingPostId(post._id);
    setEditPostData({
      caption: post.caption,
      location: post.location,
      tags: post.tags.join(", "),
    });
  }

  async function handleUpdatePost() {
    if (!editingPostId) return;

    try {
      const tags = editPostData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await axios.put(
        `${API}/api/posts/${editingPostId}`,
        {
          caption: editPostData.caption,
          tags,
          location: editPostData.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === editingPostId ? res.data : p)));
      setEditingPostId(null);
      setEditPostData({ caption: "", location: "", tags: "" });
    } catch (err) {
      console.error("Failed to update post:", err);
      alert("Failed to update post");
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!confirm("Delete this comment?")) return;

    try {
      const res = await axios.delete(
        `${API}/api/posts/${postId}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment");
    }
  }

  function startEditComment(comment: any) {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
  }

  async function handleLikeComment(postId: string, commentId: string) {
    try {
      const res = await axios.post(
        `${API}/api/posts/${postId}/comment/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
    } catch (err) {
      console.error("Failed to like comment:", err);
      alert("Failed to like comment");
    }
  }

  async function handleReplyToComment(postId: string, commentId: string) {
    if (!replyText.trim()) return;

    try {
      const res = await axios.post(
        `${API}/api/posts/${postId}/comment/${commentId}/reply`,
        { text: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPosts(posts.map((p) => (p._id === postId ? res.data : p)));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      console.error("Failed to reply to comment:", err);
      alert("Failed to reply to comment");
    }
  }

  function toggleComments(postId: string) {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  function toggleShowAll(postId: string) {
    setShowAllComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  }

  function formatTimestamp(dateString: string) {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffInHours = now.diff(date, 'hour');

    if (diffInHours < 24) {
      return date.fromNow(); // "2 hours ago"
    } else if (diffInHours < 168) { // Less than 7 days
      return date.format('dddd [at] h:mm A'); // "Monday at 3:45 PM"
    } else {
      return date.format('MMM D, YYYY [at] h:mm A'); // "Dec 14, 2025 at 3:45 PM"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#071029] dark:via-[#0a1435] dark:to-[#071029] p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Feed
          </h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Create Post
          </button>
        </div>

        {/* Posts */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No posts yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post._id}
                className="rounded-2xl shadow-md overflow-hidden"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                {/* Post Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={makeAvatarUrl(post.author.avatar)}
                      className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      alt={post.author.username}
                      onClick={() => onShowProfile(post.author)}
                    />
                    <div>
                      <div
                        className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-cyan-500"
                        onClick={() => onShowProfile(post.author)}
                      >
                        {post.author.username}
                      </div>
                      {post.location && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{post.location}</div>
                      )}
                    </div>
                  </div>

                  {/* Options Menu */}
                  {post.author._id === currentUserId && (
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => startEditPost(post)}
                              className={`${
                                active ? "bg-gray-100 dark:bg-gray-700" : ""
                              } flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300`}
                            >
                              <Edit className="w-4 h-4" />
                              Edit Post
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => handleDeletePost(post._id)}
                              className={`${
                                active ? "bg-red-50 dark:bg-red-900/20" : ""
                              } flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Post
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Menu>
                  )}
                </div>

                {/* Post Image */}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full max-h-[600px] object-cover"
                  />
                )}

                {/* Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post._id)}
                      className="flex items-center gap-1.5 group"
                    >
                      <Heart
                        className={`w-6 h-6 transition-all ${
                          post.likes.includes(currentUserId)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-700 dark:text-gray-300 group-hover:text-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {post.likes.length}
                      </span>
                    </button>
                    <button 
                      onClick={() => toggleComments(post._id)}
                      className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-cyan-500"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm font-medium">{post.comments.length}</span>
                    </button>
                  </div>

                  {/* Caption - Editable if editing */}
                  {editingPostId === post._id ? (
                    <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <textarea
                        value={editPostData.caption}
                        onChange={(e) => setEditPostData({ ...editPostData, caption: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                        rows={3}
                        placeholder="Caption..."
                      />
                      <input
                        type="text"
                        value={editPostData.location}
                        onChange={(e) => setEditPostData({ ...editPostData, location: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Location..."
                      />
                      <input
                        type="text"
                        value={editPostData.tags}
                        onChange={(e) => setEditPostData({ ...editPostData, tags: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        placeholder="Tags (comma-separated)..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdatePost}
                          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPostId(null);
                            setEditPostData({ caption: "", location: "", tags: "" });
                          }}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.caption && (
                        <p className="text-gray-900 dark:text-white">
                          <span className="font-semibold mr-2">{post.author.username}</span>
                          {post.caption}
                        </p>
                      )}

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-cyan-500 hover:underline cursor-pointer"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(post.createdAt)}
                        {post.captionEditedAt && (
                          <span className="ml-2 italic">(edited)</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      {!expandedComments[post._id] ? (
                        <button
                          onClick={() => toggleComments(post._id)}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                        >
                          Show comments ({post.comments.length})
                        </button>
                      ) : (
                        <>
                          {post.comments.length > 3 && !showAllComments[post._id] && (
                            <button
                              onClick={() => toggleShowAll(post._id)}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                            >
                              View all {post.comments.length} comments
                            </button>
                          )}
                          <div className="space-y-3">
                            {(showAllComments[post._id] ? post.comments : post.comments.slice(-3)).map((comment) => (
                              <div key={comment._id} className="flex gap-2 group">
                                <Avatar
                                  src={makeAvatarUrl(comment.user.avatar)}
                                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                  alt={comment.user.username}
                                />
                                <div className="flex-1 min-w-0">
                                  {editingCommentId === comment._id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editCommentText}
                                        onChange={(e) => setEditCommentText(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                                        rows={2}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            if (!editCommentText.trim()) return;
                                            try {
                                              const res = await axios.put(
                                                `${API}/api/posts/${post._id}/comment/${comment._id}`,
                                                { text: editCommentText },
                                                { headers: { Authorization: `Bearer ${token}` } }
                                              );
                                              setPosts(posts.map((p) => (p._id === post._id ? res.data : p)));
                                              setEditingCommentId(null);
                                              setEditCommentText("");
                                            } catch (err) {
                                              console.error("Failed to edit comment:", err);
                                              alert("Failed to edit comment");
                                            }
                                          }}
                                          className="px-3 py-1 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={() => setEditingCommentId(null)}
                                          className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <span className="font-semibold text-sm text-gray-900 dark:text-white mr-2">
                                            {comment.user.username}
                                          </span>
                                          <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {comment.text}
                                          </span>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {formatTimestamp(comment.createdAt)}
                                            </span>
                                            {comment.likes && comment.likes.length > 0 && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}
                                              </span>
                                            )}
                                            <button
                                              onClick={() => handleLikeComment(post._id, comment._id)}
                                              className={`text-xs font-medium ${
                                                comment.likes?.includes(currentUserId)
                                                  ? 'text-red-500'
                                                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                              }`}
                                            >
                                              Like
                                            </button>
                                            <button
                                              onClick={() => {
                                                setReplyingTo(comment._id);
                                                setReplyText('');
                                              }}
                                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-500 font-medium"
                                            >
                                              Reply
                                            </button>
                                            {comment.user._id === currentUserId && (
                                              <>
                                                <button
                                                  onClick={() => startEditComment(comment)}
                                                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-cyan-500 font-medium"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteComment(post._id, comment._id)}
                                                  className="text-xs text-red-500 hover:text-red-600 font-medium"
                                                >
                                                  Delete
                                                </button>
                                              </>
                                            )}
                                            {post.author._id === currentUserId && comment.user._id !== currentUserId && (
                                              <button
                                                onClick={() => handleDeleteComment(post._id, comment._id)}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium"
                                              >
                                                Delete
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="ml-4 mt-2 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                                      {!expandedReplies[comment._id] ? (
                                        <button
                                          onClick={() => toggleReplies(comment._id)}
                                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                          View replies ({comment.replies.length})
                                        </button>
                                      ) : (
                                        <>
                                          <div className="space-y-2">
                                            {comment.replies.map((reply: any, idx: number) => (
                                              <div key={idx} className="flex gap-2">
                                                <Avatar
                                                  src={makeAvatarUrl(reply.user.avatar)}
                                                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                  alt={reply.user.username}
                                                />
                                                <div>
                                                  <span className="font-semibold text-xs text-gray-900 dark:text-white mr-1">
                                                    {reply.user.username}
                                                  </span>
                                                  <span className="text-xs text-gray-700 dark:text-gray-300">
                                                    {reply.text}
                                                  </span>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {formatTimestamp(reply.createdAt)}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <button
                                            onClick={() => toggleReplies(comment._id)}
                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
                                          >
                                            Hide replies
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {replyingTo === comment._id && (
                                    <div className="ml-4 mt-2 flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            handleReplyToComment(post._id, comment._id);
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleReplyToComment(post._id, comment._id)}
                                        className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-xs"
                                      >
                                        Send
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReplyingTo(null);
                                          setReplyText('');
                                        }}
                                        className="px-3 py-1.5 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 text-xs"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            {post.comments.length > 3 && showAllComments[post._id] && (
                              <button
                                onClick={() => toggleShowAll(post._id)}
                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                Show recent
                              </button>
                            )}
                            <button
                              onClick={() => toggleComments(post._id)}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              Hide comments
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      value={commentTexts[post._id] || ""}
                      onChange={(e) =>
                        setCommentTexts({ ...commentTexts, [post._id]: e.target.value })
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleComment(post._id);
                      }}
                    />
                    <button
                      onClick={() => handleComment(post._id)}
                      className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl p-6 w-full max-w-lg" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Post</h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <textarea
                placeholder="What's on your mind?"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                rows={4}
                value={newPost.caption}
                onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
              />

              <input
                type="text"
                placeholder="Location (optional)"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={newPost.location}
                onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
              />

              <input
                type="text"
                placeholder="Tags (comma-separated)"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={newPost.tags}
                onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="post-image-upload"
                />
                <label
                  htmlFor="post-image-upload"
                  className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  {uploadingImage ? (
                    <span className="text-gray-500">Uploading...</span>
                  ) : newPost.imageUrl ? (
                    <img
                      src={newPost.imageUrl}
                      alt="Preview"
                      className="max-h-40 rounded-lg"
                    />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-500">Click to upload image</span>
                    </>
                  )}
                </label>
              </div>

              <button
                onClick={handleCreatePost}
                disabled={uploadingImage}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? "Uploading..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-50 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
