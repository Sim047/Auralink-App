// frontend/src/pages/Dashboard.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Star,
  Plus,
  Trophy,
  Globe,
  Award,
  Target,
  Zap,
  Sparkles
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CreateEventModal from "../components/CreateEventModal";

dayjs.extend(relativeTime);

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Major Sports Events
const MAJOR_SPORTS_EVENTS = [
  {
    id: 1,
    name: "FIFA World Cup 2026",
    sport: "Football",
    icon: "⚽",
    date: "June 2026",
    location: "USA, Canada, Mexico",
    type: "World Cup",
    color: "from-blue-600 to-cyan-500",
    participants: "32 teams",
  },
  {
    id: 2,
    name: "Summer Olympics 2028",
    sport: "Multi-Sport",
    icon: "🏅",
    date: "July 2028",
    location: "Los Angeles, USA",
    type: "Olympics",
    color: "from-yellow-500 to-orange-500",
    participants: "206 countries",
  },
  {
    id: 3,
    name: "ICC Cricket World Cup 2027",
    sport: "Cricket",
    icon: "🏏",
    date: "October 2027",
    location: "India, Bangladesh, Sri Lanka",
    type: "World Cup",
    color: "from-green-600 to-emerald-500",
    participants: "10 teams",
  },
  {
    id: 4,
    name: "Winter Olympics 2026",
    sport: "Winter Sports",
    icon: "⛷️",
    date: "February 2026",
    location: "Milan & Cortina, Italy",
    type: "Olympics",
    color: "from-indigo-600 to-purple-500",
    participants: "92 countries",
  },
  {
    id: 5,
    name: "Rugby World Cup 2027",
    sport: "Rugby",
    icon: "🏉",
    date: "September 2027",
    location: "Australia",
    type: "World Cup",
    color: "from-red-600 to-pink-500",
    participants: "20 teams",
  },
  {
    id: 6,
    name: "FIBA Basketball World Cup 2027",
    sport: "Basketball",
    icon: "🏀",
    date: "August 2027",
    location: "Qatar",
    type: "World Cup",
    color: "from-orange-600 to-red-500",
    participants: "32 teams",
  },
  {
    id: 7,
    name: "World Athletics Championships 2027",
    sport: "Athletics",
    icon: "🏃",
    date: "August 2027",
    location: "Tokyo, Japan",
    type: "Championship",
    color: "from-teal-600 to-cyan-500",
    participants: "200+ countries",
  },
  {
    id: 8,
    name: "Wimbledon Championships",
    sport: "Tennis",
    icon: "🎾",
    date: "July (Annual)",
    location: "London, UK",
    type: "Grand Slam",
    color: "from-green-500 to-lime-500",
    participants: "128 players",
  },
];

type Booking = {
  _id: string;
  bookingType: string;
  service?: any;
  event?: any;
  coach?: any;
  scheduledDate?: string;
  status: string;
  price?: number;
  createdAt: string;
};

type Event = {
  _id: string;
  title: string;
  startDate: string;
  time?: string;
  location?: any;
  capacity?: any;
  sport?: string;
};

export default function Dashboard({ token, onNavigate }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadDashboardData();
  }, [token]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Load user bookings
      const bookingsRes = await axios.get(`${API}/api/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const userBookings = bookingsRes.data.bookings || [];
      setBookings(userBookings);

      // Load upcoming events (next 30 days)
      const eventsRes = await axios.get(`${API}/api/events?status=published&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const events = (eventsRes.data.events || []).filter((event: Event) => {
        const eventDate = new Date(event.startDate);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        return eventDate >= now && eventDate <= thirtyDaysFromNow;
      });

      setUpcomingEvents(events);

      // Create notifications for upcoming bookings
      const upcomingBookings = userBookings.filter((booking: Booking) => {
        if (!booking.scheduledDate) return false;
        const bookingDate = new Date(booking.scheduledDate);
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);
        return bookingDate >= now && bookingDate <= threeDaysFromNow && booking.status === 'confirmed';
      });

      const eventNotifications = events.slice(0, 3).map((event: Event) => ({
        id: event._id,
        type: 'event',
        title: `Upcoming: ${event.title}`,
        message: `${dayjs(event.startDate).format('MMM D')} at ${event.location?.city || 'TBD'}`,
        time: dayjs(event.startDate).fromNow(),
      }));

      const bookingNotifications = upcomingBookings.map((booking: Booking) => ({
        id: booking._id,
        type: 'booking',
        title: `Booking reminder`,
        message: `${booking.bookingType} on ${dayjs(booking.scheduledDate).format('MMM D')}`,
        time: dayjs(booking.scheduledDate).fromNow(),
      }));

      setNotifications([...bookingNotifications, ...eventNotifications].slice(0, 5));

    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const getBookingTitle = (booking: Booking) => {
    if (booking.service) return booking.service.name || 'Service Booking';
    if (booking.event) return booking.event.title || 'Event Booking';
    if (booking.coach) return `Session with ${booking.coach.username || 'Coach'}`;
    return 'Booking';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const stats = {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    upcomingEvents: upcomingEvents.length,
    notifications: notifications.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#071029] dark:via-[#0a1435] dark:to-[#071029] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#071029] dark:via-[#0a1435] dark:to-[#071029]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's what's happening with your bookings and events
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.confirmedBookings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Upcoming Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingEvents}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Notifications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.notifications}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-teal-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Notifications
              </h2>
            </div>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 shrink-0">
                    {notif.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Major Sports Events Section */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Major Sports Events</h2>
                <p className="text-white/80 text-sm">World Cup, Olympics & Championships</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MAJOR_SPORTS_EVENTS.map((event) => (
                <div
                  key={event.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${event.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                      {event.icon}
                    </div>
                    <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-medium">
                      {event.type}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                    {event.name}
                  </h3>
                  
                  <div className="space-y-1 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.participants}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-xs">
                    <Trophy className="w-3 h-3" />
                    <span className="font-medium">{event.sport}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Bookings */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Bookings
              </h2>
              <button
                onClick={() => onNavigate && onNavigate('discover')}
                className="text-teal-500 hover:text-teal-600 text-sm font-medium flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No bookings yet</p>
                <button
                  onClick={() => onNavigate && onNavigate('discover')}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30"
                >
                  Browse Services
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {getBookingTitle(booking)}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {booking.scheduledDate
                              ? dayjs(booking.scheduledDate).format('MMM D, YYYY')
                              : 'Date TBD'}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Community Events
              </h2>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-teal-500/30"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No upcoming events</p>
                <button
                  onClick={() => onNavigate && onNavigate('discover')}
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div
                    key={event._id}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-teal-500/30">
                        {dayjs(event.startDate).format('DD')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {event.title}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span className="truncate">
                              {dayjs(event.startDate).format('MMM D, YYYY')}
                              {event.time && ` · ${event.time}`}
                            </span>
                          </div>
                          {event.location?.city && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="truncate">{event.location.city}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="relative overflow-hidden bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-3xl p-8 text-white">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">Ready to train?</h2>
                <p className="text-white/90">
                  Discover new coaches, join events, or book your next training session
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => onNavigate && onNavigate('discover')}
                className="px-6 py-3 bg-white text-teal-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-xl flex items-center gap-2"
              >
                <Target className="w-5 h-5" />
                Explore Now
              </button>
              <button
                onClick={() => onNavigate && onNavigate('all-users')}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/30 flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Find Coaches
              </button>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/30 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={createEventModalOpen}
        onClose={() => setCreateEventModalOpen(false)}
        token={token}
        onSuccess={() => {
          loadDashboardData();
          setCreateEventModalOpen(false);
        }}
      />
    </div>
  );
}
