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
  X
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface SidebarProps {
  token: string;
  onNavigate?: (view: string) => void;
}

export default function Sidebar({ token, onNavigate }: SidebarProps) {
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
      const res = await axios.get(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });
      
      if (res.status === 404) {
        // Backend endpoint not available yet - use defaults
        setFollowers(0);
        setFollowing(0);
        setError(true);
        return;
      }
      
      const user = res.data;
      setFollowers(Array.isArray(user.followers) ? user.followers.length : 0);
      setFollowing(Array.isArray(user.following) ? user.following.length : 0);
    } catch (err: any) {
      // Only log unexpected errors (5xx server errors)
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

  // Mobile toggle button
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-600 shadow-lg transition-all"
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
    <div className="h-full flex flex-col">
      {/* Header */}
      {!isCollapsed && (
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white mb-1">Quick Stats</h2>
          <p className="text-sm text-slate-400">Your activity overview</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {loading && !error ? (
          // Loading skeleton
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-slate-800 rounded-xl"></div>
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
                  relative overflow-hidden rounded-xl p-4 cursor-pointer
                  transition-all duration-300 hover:scale-105 hover:shadow-xl
                  ${isCollapsed ? 'aspect-square' : ''}
                `}
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-90`}></div>
                
                <div className="relative z-10">
                  <div className={`flex ${isCollapsed ? 'flex-col items-center justify-center h-full' : 'items-center justify-between'}`}>
                    <div className={isCollapsed ? 'mb-2' : ''}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    {!isCollapsed && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-white/80 mt-0.5">
                          {stat.label}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {isCollapsed && (
                    <div className="text-center mt-2">
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {error && !loading && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-xs text-yellow-400 text-center">
              {isCollapsed ? '⚠️' : 'Unable to load stats'}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Refresh button */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={loadUserStats}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      )}
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

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 right-0 h-screen
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-l border-slate-700 shadow-2xl
          transition-all duration-300 z-40
          ${isCollapsed ? 'w-20' : 'w-80'}
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
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
