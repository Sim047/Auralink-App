// frontend/src/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Home,
  Search,
  CalendarDays,
  MessageCircle,
  LogOut,
  Sun,
  Moon
} from "lucide-react";
import Avatar from "./Avatar";
import StatusPicker from "./StatusPicker";
import SearchUsers from "./SearchUsers";
import logo from "../assets/logo.png";

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface SidebarProps {
  token: string;
  user: any;
  theme: string;
  myStatus: any;
  onNavigate?: (view: string) => void;
  onThemeToggle: () => void;
  onLogout: () => void;
  onStatusUpdated: (status: any) => void;
  onShowProfile: (user: any) => void;
  onOpenConversation: (conversation: any) => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarSave: () => void;
  onAvatarCancel: () => void;
  selectedAvatar: File | null;
  conversations: any[];
  makeAvatarUrl: (url?: string) => string;
}

export default function Sidebar({
  token,
  user,
  theme,
  myStatus,
  onNavigate,
  onThemeToggle,
  onLogout,
  onStatusUpdated,
  onShowProfile,
  onOpenConversation,
  onAvatarUpload,
  onAvatarSave,
  onAvatarCancel,
  selectedAvatar,
  conversations,
  makeAvatarUrl
}: SidebarProps) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, [token]);

  async function loadUserStats() {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(false);
      console.log("Loading user stats from:", `${API}/api/users/me`);
      
      const res = await axios.get(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 500,
      });
      
      console.log("User stats response:", res.status, res.data);
      
      if (res.status === 404) {
        console.warn("User endpoint not found (404)");
        setFollowers(0);
        setFollowing(0);
        setError(true);
        return;
      }
      
      const userData = res.data;
      const followersCount = Array.isArray(userData.followers) ? userData.followers.length : 0;
      const followingCount = Array.isArray(userData.following) ? userData.following.length : 0;
      
      console.log("Setting followers:", followersCount, "following:", followingCount);
      setFollowers(followersCount);
      setFollowing(followingCount);
    } catch (err: any) {
      console.error("Sidebar stats error:", err);
      setError(true);
      setFollowers(0);
      setFollowing(0);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      icon: Users,
      label: "Followers",
      value: followers,
      color: "from-blue-500 to-cyan-500",
      onClick: () => onNavigate?.('followers')
    },
    {
      icon: UserPlus,
      label: "Following",
      value: following,
      color: "from-purple-500 to-pink-500",
      onClick: () => onNavigate?.('following')
    },
    {
      icon: Calendar,
      label: "Events",
      value: "—",
      color: "from-green-500 to-emerald-500",
      onClick: () => onNavigate?.('discover')
    },
    {
      icon: TrendingUp,
      label: "Activity",
      value: "—",
      color: "from-orange-500 to-red-500",
      onClick: () => onNavigate?.('dashboard')
    }
  ];

  // Helper component for navigation buttons
  const NavButton = ({ icon: Icon, label, badge, isCollapsed, onClick }: any) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-all group"
      title={isCollapsed ? label : ''}
    >
      <Icon className="w-5 h-5 text-slate-300 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
      {!isCollapsed && (
        <span className="flex-1 text-left text-sm font-medium text-slate-200 group-hover:text-white">
          {label}
        </span>
      )}
      {!isCollapsed && badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full font-semibold">
          {badge}
        </span>
      )}
    </button>
  );

  // Mobile toggle button
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 shadow-lg transition-all"
    >
      {isMobileOpen ? (
        <X className="w-5 h-5 text-white" />
      ) : (
        <Menu className="w-5 h-5 text-white" />
      )}
    </button>
  );

  // Desktop collapse toggle
  const CollapseToggle = () => (
    <button
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="hidden lg:flex absolute -right-3 top-8 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 shadow-lg transition-all z-10"
    >
      {isCollapsed ? (
        <ChevronRight className="w-4 h-4 text-white" />
      ) : (
        <ChevronLeft className="w-4 h-4 text-white" />
      )}
    </button>
  );

  const SidebarContent = () => (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Header with Logo and Theme Toggle */}
      <div className="p-4 border-b border-slate-700">
        {!isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-full">
              <button
                onClick={onThemeToggle}
                className="group relative p-2 rounded-lg border border-slate-600 hover:border-cyan-500 hover:bg-slate-700/60 transition-all duration-300"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 group-hover:text-slate-600 transition-colors" />
                )}
              </button>
            </div>
            <img
              src={logo}
              className="w-16 h-16 rounded-xl object-cover shadow-lg"
              alt="logo"
            />
            <h2 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              BANJA
            </h2>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <img
              src={logo}
              className="w-10 h-10 rounded-lg object-cover"
              alt="logo"
            />
            <button
              onClick={onThemeToggle}
              className="group p-1.5 rounded-lg border border-slate-600 hover:border-cyan-500 hover:bg-slate-700/60 transition-all duration-300"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 group-hover:text-slate-600 transition-colors" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* User Profile Section */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Avatar
              src={makeAvatarUrl(user?.avatar)}
              className="w-12 h-12 rounded-lg object-cover"
              alt={user?.username || "User"}
            />
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{user?.username}</div>
              <div className="text-xs opacity-70 truncate">{user?.role?.toUpperCase() || "USER"}</div>
            </div>
          </div>

          {myStatus && (
            <div className="text-xs flex gap-1 items-center mb-3">
              <span>{myStatus.emoji}</span>
              <span className="opacity-80 truncate">{myStatus.mood}</span>
            </div>
          )}

          <StatusPicker
            token={token}
            currentStatus={myStatus}
            onUpdated={onStatusUpdated}
          />

          {/* Avatar Upload - moved here from below */}
          <div className="mt-4 pt-4 border-t border-slate-600">
            <label className="block text-xs mb-2 text-slate-400">Change Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarUpload}
              className="text-xs w-full"
            />
            {selectedAvatar && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onAvatarSave}
                  className="flex-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs rounded-lg transition-all"
                >
                  Save
                </button>
                <button
                  onClick={onAvatarCancel}
                  className="flex-1 px-3 py-1.5 border border-slate-600 hover:bg-slate-700 text-xs rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="p-2 space-y-1">
        <NavButton
          icon={Home}
          label="Dashboard"
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('dashboard');
            setIsMobileOpen(false);
          }}
        />
        <NavButton
          icon={Search}
          label="Discover"
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('discover');
            setIsMobileOpen(false);
          }}
        />
        <NavButton
          icon={CalendarDays}
          label="My Events"
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('my-events');
            setIsMobileOpen(false);
          }}
        />
        <NavButton
          icon={Users}
          label="All Users"
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('all-users');
            setIsMobileOpen(false);
          }}
        />
        <NavButton
          icon={MessageCircle}
          label="Rooms"
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('rooms');
            setIsMobileOpen(false);
          }}
        />
        <NavButton
          icon={MessageCircle}
          label="Direct Messages"
          badge={conversations.length}
          isCollapsed={isCollapsed}
          onClick={() => {
            onNavigate?.('direct-messages');
            setIsMobileOpen(false);
          }}
        />
      </div>

      {/* Search Users */}
      {!isCollapsed && (
        <div className="px-4 py-2 border-t border-slate-700">
          <SearchUsers
            token={token}
            currentUserId={user?._id}
            onShowProfile={onShowProfile}
            onOpenConversation={onOpenConversation}
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex-1 p-4 border-t border-slate-700">
        {!isCollapsed && (
          <h3 className="text-sm font-bold text-slate-300 mb-3">Quick Stats</h3>
        )}
        
        <div className="space-y-2">
          {loading && !error ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </>
          ) : (
            stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  onClick={stat.onClick}
                  className={`
                    relative overflow-hidden rounded-xl p-3 cursor-pointer
                    transition-all duration-300 hover:scale-105 hover:shadow-xl
                    ${isCollapsed ? 'aspect-square' : ''}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-90`}></div>
                  
                  <div className="relative z-10">
                    <div className={`flex ${isCollapsed ? 'flex-col items-center justify-center h-full' : 'items-center justify-between'}`}>
                      <div className={isCollapsed ? 'mb-1' : ''}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      {!isCollapsed && (
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">
                            {stat.value}
                          </p>
                          <p className="text-xs text-white/80 mt-0.5">
                            {stat.label}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {isCollapsed && (
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">{stat.value}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && !loading && !isCollapsed && (
          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-xs text-yellow-400 text-center">
              Unable to load stats
            </p>
          </div>
        )}
      </div>

      {/* Logout and Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        {!isCollapsed && (
          <button
            onClick={loadUserStats}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-xs font-medium disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        )}
        
        <button
          onClick={onLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium`}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Log Out</span>}
        </button>

        {!isCollapsed && (
          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">SIMON KATHULU</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <MobileToggle />

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Unified Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700 shadow-2xl
          transition-all duration-300 z-40
          ${isCollapsed ? 'w-20' : 'w-80'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="relative h-full">
          <CollapseToggle />
          <SidebarContent />
        </div>
      </div>
    </>
  );
}
