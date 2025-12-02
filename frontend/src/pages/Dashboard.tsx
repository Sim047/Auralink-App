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
  BookOpen,
  Star,
  Plus,
  Trophy,
  Award,
  Sparkles
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CreateEventModal from "../components/CreateEventModal";
import SportEvents from "./SportEvents";

dayjs.extend(relativeTime);

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Comprehensive Sports Categories
const ALL_SPORTS = [
  // Olympic Sports
  { name: "Football/Soccer", category: "Team Sports", icon: "⚽", popular: true },
  { name: "Basketball", category: "Team Sports", icon: "🏀", popular: true },
  { name: "Volleyball", category: "Team Sports", icon: "🏐", popular: true },
  { name: "Tennis", category: "Racquet Sports", icon: "🎾", popular: true },
  { name: "Swimming", category: "Aquatic Sports", icon: "🏊", popular: true },
  { name: "Athletics/Track & Field", category: "Individual Sports", icon: "🏃", popular: true },
  { name: "Gymnastics", category: "Artistic Sports", icon: "🤸", popular: true },
  { name: "Boxing", category: "Combat Sports", icon: "🥊", popular: true },
  { name: "Cycling", category: "Individual Sports", icon: "🚴", popular: true },
  { name: "Baseball", category: "Team Sports", icon: "⚾", popular: true },
  
  // Major World Sports
  { name: "Cricket", category: "Team Sports", icon: "🏏", popular: true },
  { name: "Rugby", category: "Team Sports", icon: "🏉", popular: true },
  { name: "Hockey (Ice)", category: "Team Sports", icon: "🏒", popular: true },
  { name: "Hockey (Field)", category: "Team Sports", icon: "🏑", popular: true },
  { name: "Golf", category: "Individual Sports", icon: "⛳", popular: true },
  
  // Combat Sports
  { name: "Wrestling", category: "Combat Sports", icon: "🤼", popular: false },
  { name: "Judo", category: "Combat Sports", icon: "🥋", popular: false },
  { name: "Karate", category: "Combat Sports", icon: "🥋", popular: false },
  { name: "Taekwondo", category: "Combat Sports", icon: "🥋", popular: false },
  { name: "Kung Fu", category: "Combat Sports", icon: "🥋", popular: false },
  { name: "Mixed Martial Arts (MMA)", category: "Combat Sports", icon: "🥊", popular: true },
  { name: "Kickboxing", category: "Combat Sports", icon: "🥊", popular: false },
  { name: "Muay Thai", category: "Combat Sports", icon: "🥊", popular: false },
  { name: "Fencing", category: "Combat Sports", icon: "🤺", popular: false },
  
  // Racquet Sports
  { name: "Badminton", category: "Racquet Sports", icon: "🏸", popular: true },
  { name: "Table Tennis/Ping Pong", category: "Racquet Sports", icon: "🏓", popular: true },
  { name: "Squash", category: "Racquet Sports", icon: "🎾", popular: false },
  { name: "Racquetball", category: "Racquet Sports", icon: "🎾", popular: false },
  { name: "Pickleball", category: "Racquet Sports", icon: "🏸", popular: false },
  
  // Aquatic Sports
  { name: "Diving", category: "Aquatic Sports", icon: "🤿", popular: false },
  { name: "Water Polo", category: "Aquatic Sports", icon: "🤽", popular: false },
  { name: "Synchronized Swimming", category: "Aquatic Sports", icon: "🏊", popular: false },
  { name: "Surfing", category: "Aquatic Sports", icon: "🏄", popular: true },
  { name: "Rowing", category: "Aquatic Sports", icon: "🚣", popular: false },
  { name: "Canoeing/Kayaking", category: "Aquatic Sports", icon: "🛶", popular: false },
  { name: "Sailing", category: "Aquatic Sports", icon: "⛵", popular: false },
  
  // Winter Sports
  { name: "Skiing (Alpine)", category: "Winter Sports", icon: "⛷️", popular: true },
  { name: "Skiing (Cross-Country)", category: "Winter Sports", icon: "⛷️", popular: false },
  { name: "Snowboarding", category: "Winter Sports", icon: "🏂", popular: true },
  { name: "Ice Skating", category: "Winter Sports", icon: "⛸️", popular: true },
  { name: "Figure Skating", category: "Winter Sports", icon: "⛸️", popular: false },
  { name: "Speed Skating", category: "Winter Sports", icon: "⛸️", popular: false },
  { name: "Curling", category: "Winter Sports", icon: "🥌", popular: false },
  { name: "Bobsled", category: "Winter Sports", icon: "🛷", popular: false },
  { name: "Luge", category: "Winter Sports", icon: "🛷", popular: false },
  
  // Fitness & Wellness
  { name: "Yoga", category: "Fitness & Wellness", icon: "🧘", popular: true },
  { name: "Pilates", category: "Fitness & Wellness", icon: "🧘", popular: false },
  { name: "CrossFit", category: "Fitness & Wellness", icon: "💪", popular: true },
  { name: "Aerobics", category: "Fitness & Wellness", icon: "💃", popular: false },
  { name: "Zumba", category: "Fitness & Wellness", icon: "💃", popular: false },
  { name: "Bodybuilding", category: "Fitness & Wellness", icon: "💪", popular: false },
  { name: "Powerlifting", category: "Fitness & Wellness", icon: "🏋️", popular: false },
  { name: "Weightlifting", category: "Fitness & Wellness", icon: "🏋️", popular: false },
  
  // Extreme Sports
  { name: "Skateboarding", category: "Extreme Sports", icon: "🛹", popular: true },
  { name: "BMX", category: "Extreme Sports", icon: "🚴", popular: false },
  { name: "Rock Climbing", category: "Extreme Sports", icon: "🧗", popular: true },
  { name: "Parkour", category: "Extreme Sports", icon: "🤸", popular: false },
  { name: "Bungee Jumping", category: "Extreme Sports", icon: "🪂", popular: false },
  { name: "Skydiving", category: "Extreme Sports", icon: "🪂", popular: false },
  { name: "Paragliding", category: "Extreme Sports", icon: "🪂", popular: false },
  
  // Target Sports
  { name: "Archery", category: "Target Sports", icon: "🏹", popular: false },
  { name: "Shooting", category: "Target Sports", icon: "🎯", popular: false },
  { name: "Darts", category: "Target Sports", icon: "🎯", popular: false },
  
  // Motor Sports
  { name: "Formula 1 Racing", category: "Motor Sports", icon: "🏎️", popular: true },
  { name: "MotoGP", category: "Motor Sports", icon: "🏍️", popular: true },
  { name: "NASCAR", category: "Motor Sports", icon: "🏎️", popular: false },
  { name: "Rally Racing", category: "Motor Sports", icon: "🏎️", popular: false },
  { name: "Karting", category: "Motor Sports", icon: "🏎️", popular: false },
  
  // Equestrian
  { name: "Horse Racing", category: "Equestrian", icon: "🏇", popular: true },
  { name: "Show Jumping", category: "Equestrian", icon: "🏇", popular: false },
  { name: "Dressage", category: "Equestrian", icon: "🏇", popular: false },
  { name: "Polo", category: "Equestrian", icon: "🏇", popular: false },
  
  // Other Team Sports
  { name: "American Football", category: "Team Sports", icon: "🏈", popular: true },
  { name: "Australian Rules Football", category: "Team Sports", icon: "🏈", popular: false },
  { name: "Handball", category: "Team Sports", icon: "🤾", popular: false },
  { name: "Lacrosse", category: "Team Sports", icon: "🥍", popular: false },
  { name: "Netball", category: "Team Sports", icon: "🏐", popular: false },
  { name: "Softball", category: "Team Sports", icon: "🥎", popular: false },
  
  // Mind Sports & Strategy
  { name: "Chess", category: "Mind Sports", icon: "♟️", popular: true },
  { name: "Checkers", category: "Mind Sports", icon: "⚫", popular: false },
  { name: "Go (Baduk/Weiqi)", category: "Mind Sports", icon: "⚫", popular: false },
  { name: "Poker", category: "Mind Sports", icon: "🃏", popular: false },
  { name: "Bridge", category: "Mind Sports", icon: "🃏", popular: false },
  { name: "Esports/Gaming", category: "Mind Sports", icon: "🎮", popular: true },
  
  // Dance Sports
  { name: "Ballroom Dancing", category: "Dance Sports", icon: "💃", popular: false },
  { name: "Hip Hop Dance", category: "Dance Sports", icon: "💃", popular: false },
  { name: "Ballet", category: "Dance Sports", icon: "🩰", popular: false },
  { name: "Breakdancing/Breaking", category: "Dance Sports", icon: "🕺", popular: true },
  
  // Other Individual Sports
  { name: "Triathlon", category: "Individual Sports", icon: "🏃", popular: true },
  { name: "Marathon Running", category: "Individual Sports", icon: "🏃", popular: true },
  { name: "Decathlon", category: "Individual Sports", icon: "🏃", popular: false },
  { name: "Pentathlon", category: "Individual Sports", icon: "🏃", popular: false },
  { name: "Bowling", category: "Individual Sports", icon: "🎳", popular: false },
  { name: "Billiards/Pool", category: "Individual Sports", icon: "🎱", popular: false },
  { name: "Snooker", category: "Individual Sports", icon: "🎱", popular: false },
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
  const [showAllSports, setShowAllSports] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

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

  // Get unique categories
  const categories = ["All", ...new Set(ALL_SPORTS.map(s => s.category))];
  
  // Filter sports by category
  const filteredSports = selectedCategory === "All" 
    ? ALL_SPORTS 
    : ALL_SPORTS.filter(s => s.category === selectedCategory);
  
  // Sports to display
  const popularSports = ALL_SPORTS.filter(s => s.popular);
  const displaySports = showAllSports ? filteredSports : popularSports;

  // If viewing a specific sport's events, show that component
  if (selectedSport) {
    return (
      <SportEvents
        sport={selectedSport}
        token={token}
        onBack={() => setSelectedSport(null)}
      />
    );
  }

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

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 rounded-xl shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Events happening in the next 30 days</p>
                </div>
              </div>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div
                  key={event._id}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    {event.sport && (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {event.sport}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="truncate">
                        {dayjs(event.startDate).format('MMM D, YYYY')}
                        {event.time && ` at ${event.time}`}
                      </span>
                    </div>
                    {event.location?.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {event.location.city}
                          {event.location.state && `, ${event.location.state}`}
                        </span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {event.capacity.current || 0} / {event.capacity.max} participants
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {dayjs(event.startDate).fromNow()}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>

            {upcomingEvents.length > 6 && (
              <div className="mt-6 text-center">
                <button
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all duration-300 inline-flex items-center gap-2"
                >
                  View All {upcomingEvents.length} Events
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State for Events */}
        {upcomingEvents.length === 0 && (
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There are no events scheduled for the next 30 days. Create one to get started!
              </p>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-medium rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </button>
            </div>
          </div>
        )}

        {/* All Sports Categories Section */}
        <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-8 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl shadow-lg shadow-teal-500/30">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Browse All Sports
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {showAllSports 
                    ? `Showing ${displaySports.length} sports` 
                    : `Showing ${popularSports.length} popular sports`}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAllSports(!showAllSports)}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30 flex items-center gap-2"
            >
              {showAllSports ? (
                <>
                  <Star className="w-4 h-4" />
                  Show Popular Only
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  View All {ALL_SPORTS.length} Sports
                </>
              )}
            </button>
          </div>

          {/* Category Filter */}
          {showAllSports && (
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Sports Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {displaySports.map((sport, index) => (
              <div
                key={index}
                onClick={() => setSelectedSport(sport.name)}
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group relative"
              >
                {sport.popular && !showAllSports && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                    {sport.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-teal-500 transition-colors">
                    {sport.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sport.category}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Sports Notification Banner */}
          {!showAllSports && (
            <div className="mt-6 p-6 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl border-2 border-teal-200 dark:border-teal-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-500 rounded-xl shadow-lg shadow-teal-500/30 shrink-0">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-500" />
                    Popular Sports Highlighted
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                    We're showing the {popularSports.length} most popular sports. Want to explore more options?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ALL_SPORTS.filter(s => s.category === "Team Sports").length} Team Sports
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ALL_SPORTS.filter(s => s.category === "Combat Sports").length} Combat Sports
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ALL_SPORTS.filter(s => s.category === "Winter Sports").length} Winter Sports
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      {ALL_SPORTS.filter(s => s.category === "Mind Sports").length} Mind Sports
                    </span>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      +{categories.length - 5} more categories
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                <Trophy className="w-6 h-6" />
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
                <Star className="w-5 h-5" />
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
