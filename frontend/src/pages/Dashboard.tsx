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
  Plus,
  Sparkles,
  Trophy,
  Star,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CreateEventModal from "../components/CreateEventModal";
import EventDetailModal from "../components/EventDetailModal";
import EventParticipantsModal from "../components/EventParticipantsModal";
import MyJoinRequestsPage from "./MyJoinRequests";
import PendingApprovalsPage from "./PendingApprovals";
import AllEvents from "./AllEvents";
import NotificationsPage from "./Notifications";
import SportEvents from "./SportEvents";

dayjs.extend(relativeTime);

const API = import.meta.env.VITE_API_URL || "";

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
  organizer?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  participants?: any[];
  maxParticipants?: number;
};

export default function Dashboard({ token, onNavigate }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [eventsFilter, setEventsFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [showEvents, setShowEvents] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'myRequests' | 'approvals' | 'allEvents' | 'notifications'>('dashboard');
  const [myRequestsCount, setMyRequestsCount] = useState(0);
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [approvedRequestsCount, setApprovedRequestsCount] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [participantsModalEvent, setParticipantsModalEvent] = useState<any | null>(null);

  useEffect(() => {
    if (!token) return;
    loadDashboardData();
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) || {};
      setCurrentUserId(payload.id || payload._id);
    } catch {}
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

      // Load booking counts for quick stats
      try {
        const myRequestsRes = await axios.get(`${API}/api/bookings-simple/my-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allRequests = myRequestsRes.data.bookings || [];
        const pendingRequests = allRequests.filter((b: any) => b.status === "pending");
        const approvedRequests = allRequests.filter((b: any) => b.status === "approved");
        setMyRequestsCount(pendingRequests.length);
        setPendingRequestsCount(pendingRequests.length);
        setApprovedRequestsCount(approvedRequests.length);
        
        const approvalsRes = await axios.get(`${API}/api/bookings-simple/to-approve`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApprovalsCount(approvalsRes.data.bookings?.length || 0);
      } catch (err) {
        console.error("Booking counts error:", err);
      }
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

  // Open Event Details (populated) by id
  const openEventDetails = async (eventId: string) => {
    try {
      const resp = await axios.get(`${API}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedEvent(resp.data);
    } catch (e) {
      // Fallback to locally loaded list if available
      const fallback = upcomingEvents.find((e: any) => e._id === eventId) || null;
      setSelectedEvent(fallback);
    }
  };

  const openParticipantsModal = async (eventObj: any) => {
    try {
      const resp = await axios.get(`${API}/api/events/${eventObj._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParticipantsModalEvent(resp.data);
    } catch (e) {
      setParticipantsModalEvent(eventObj);
    }
    setSelectedEvent(null);
  };

  // Basic join handler: route to Discover for full join/payment flow
  const handleJoinFromDashboard = (eventId: string) => {
    if (onNavigate) onNavigate('discover');
  };

  // Message organizer fallback: create conversation then navigate home
  const handleMessageOrganizer = async (organizerId: string) => {
    if (!token) return;
    try {
      const res = await axios.post(
        `${API}/api/conversations`,
        { partnerId: organizerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem("auralink-active-conversation", JSON.stringify(res.data));
      localStorage.setItem("auralink-in-dm", "true");
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to start conversation:", err);
    }
  };

  // View Mode Routing
  if (viewMode === 'myRequests') {
    return <MyJoinRequestsPage onBack={() => setViewMode('dashboard')} onNavigate={onNavigate} />;
  }

  if (viewMode === 'approvals') {
    return <PendingApprovalsPage token={token} onBack={() => setViewMode('dashboard')} onNavigate={onNavigate} />;
  }

  if (viewMode === 'allEvents') {
    return (
      <>
        <AllEvents
          token={token}
          onBack={() => setViewMode('dashboard')}
          onNavigate={onNavigate}
          onViewEvent={(id: string) => openEventDetails(id)}
        />
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onJoin={handleJoinFromDashboard}
          onMessage={handleMessageOrganizer}
          onViewParticipants={openParticipantsModal}
          currentUserId={currentUserId}
        />
        {participantsModalEvent && (
          <EventParticipantsModal
            event={participantsModalEvent}
            onClose={() => setParticipantsModalEvent(null)}
            onMessage={handleMessageOrganizer}
            onApproveRequest={async (eventId: string, requestId: string) => {
              try {
                await axios.post(
                  `${API}/api/events/${eventId}/approve-request/${requestId}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const refreshed = await axios.get(`${API}/api/events/${eventId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setParticipantsModalEvent(refreshed.data);
              } catch (err) {
                console.error('Approve error:', err);
              }
            }}
            onRejectRequest={async (eventId: string, requestId: string) => {
              try {
                await axios.post(
                  `${API}/api/events/${eventId}/reject-request/${requestId}`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                const refreshed = await axios.get(`${API}/api/events/${eventId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setParticipantsModalEvent(refreshed.data);
              } catch (err) {
                console.error('Reject error:', err);
              }
            }}
            currentUserId={currentUserId}
            isOrganizer={participantsModalEvent?.organizer?._id === currentUserId}
          />
        )}
      </>
    );
  }

  if (viewMode === 'notifications') {
    return <NotificationsPage token={token} onBack={() => setViewMode('dashboard')} />;
  }

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
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Welcome back! 👋 <Sparkles className="inline w-6 h-6 text-accent align-text-bottom ml-1" />
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Here's what's happening with your bookings and events
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* My Join Requests - Clickable */}
          <button
            onClick={() => setViewMode('myRequests')}
            className="rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            style={{ background: 'var(--card)', border: '2px solid var(--border)', color: 'var(--text)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1 font-medium">My Join Requests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{myRequestsCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending approval</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>

          {/* Pending Approvals - Clickable */}
          <button
            onClick={() => setViewMode('approvals')}
            className="rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            style={{ background: 'var(--card)', border: '2px solid var(--border)', color: 'var(--text)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mb-1 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{approvalsCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting your review</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:rotate-12 transition-transform">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>

          {/* All Events - Clickable */}
          <button
            onClick={() => setViewMode('allEvents')}
            className="rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            style={{ background: 'var(--card)', border: '2px solid var(--border)', color: 'var(--text)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1 font-medium">All Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcomingEvents}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upcoming events</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:rotate-12 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>

          {/* Notifications - Clickable */}
          <button
            onClick={() => setViewMode('notifications')}
            className="rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            style={{ background: 'var(--card)', border: '2px solid var(--border)', color: 'var(--text)' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-red-400 mb-1 font-medium">Notifications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.notifications}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View all updates</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 ring-1 ring-accent/30 group-hover:rotate-12 transition-transform">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>
          </button>
        </div>

        {/* Second Row - Additional Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Requests */}
          <button
            onClick={() => setViewMode('myRequests')}
            className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-700 hover:shadow-xl hover:scale-105 hover:border-accent/30 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-1 font-medium">Pending Requests</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-300">{pendingRequestsCount}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-500" />
            </div>
          </button>

          {/* Approved Requests */}
          <button
            onClick={() => setViewMode('myRequests')}
            className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-700 hover:shadow-xl hover:scale-105 hover:border-accent/30 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400 mb-1 font-medium">Approved Requests</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-300">{approvedRequestsCount}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
            </div>
          </button>

          {/* Total Bookings */}
          <div className="rounded-2xl p-6 hover:shadow-lg transition-all duration-300" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
              </div>
              <BookOpen className="w-10 h-10 text-teal-500" />
            </div>
          </div>

          {/* Confirmed Bookings */}
          <div className="rounded-2xl p-6 hover:shadow-lg transition-all duration-300" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.confirmedBookings}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Ready to Train Banner - Always at the bottom */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Ready to Train?</h2>
            </div>
            <p className="text-lg mb-6 text-white/90">
              Join events, connect with athletes, and take your fitness to the next level!
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate && onNavigate('discover')}
                className="px-6 py-3 bg-white text-accent font-bold rounded-xl border border-accent/30 hover:border-accent/50 hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Discover Events
              </button>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/30 transition-all duration-300 border-2 border-white/50 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('my-activities');
                    // Set active tab to services
                    setTimeout(() => {
                      const servicesTab = document.querySelector('[data-tab="services"]') as HTMLElement;
                      if (servicesTab) servicesTab.click();
                    }, 100);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Service
              </button>
              <button
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('my-activities');
                    // Set active tab to products
                    setTimeout(() => {
                      const productsTab = document.querySelector('[data-tab="products"]') as HTMLElement;
                      if (productsTab) productsTab.click();
                    }, 100);
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Sell Product
              </button>
            </div>
          </div>
        </div>

        {/* Community & Bookings section */}
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Bookings
              </h2>
              <button
                onClick={() => onNavigate && onNavigate('discover')}
                className="text-accent hover:text-accent-light text-sm font-medium flex items-center gap-1"
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
                  className="px-6 py-2.5 bg-gradient-to-r from-accent to-accentViolet-light hover:from-accent-dark hover:to-accentViolet-dark text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg"
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
          <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Community Events
              </h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Filter:</label>
                <select
                  value={eventsFilter}
                  onChange={(e) => setEventsFilter(e.target.value as any)}
                  className="text-sm px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="all">All</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <button
                  onClick={() => setShowEvents((v) => !v)}
                  className="text-sm px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800"
                  aria-expanded={showEvents}
                >
                  {showEvents ? 'Hide' : 'Show'}
                </button>
              </div>
              <button
                onClick={() => setCreateEventModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-accent to-accentViolet-light hover:from-accent-dark hover:to-accentViolet-dark text-white text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </button>
            </div>

            {!showEvents ? (
              <div className="text-center py-10 text-gray-600 dark:text-gray-400">
                Events are hidden. Click "Show" to view.
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">No upcoming events</p>
                <button
                  onClick={() => onNavigate && onNavigate('discover')}
                  className="px-6 py-2.5 bg-gradient-to-r from-accent to-accentViolet-light hover:from-accent-dark hover:to-accentViolet-dark text-white text-sm font-medium rounded-xl transition-all duration-300 shadow-lg"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents
                  .filter((e) => eventsFilter === 'all' || (e.pricing?.type || 'free') === eventsFilter)
                  .slice(0, 5)
                  .map((event) => (
                  <div
                    key={event._id}
                    onClick={() => openEventDetails(event._id)}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-light rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg">
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
      {/* Event Detail Modal (Dashboard view) */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onJoin={handleJoinFromDashboard}
        onMessage={handleMessageOrganizer}
        onViewParticipants={openParticipantsModal}
        currentUserId={currentUserId}
      />
      {participantsModalEvent && (
        <EventParticipantsModal
          event={participantsModalEvent}
          onClose={() => setParticipantsModalEvent(null)}
          onMessage={handleMessageOrganizer}
          onApproveRequest={async (eventId: string, requestId: string) => {
            try {
              await axios.post(
                `${API}/api/events/${eventId}/approve-request/${requestId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const refreshed = await axios.get(`${API}/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setParticipantsModalEvent(refreshed.data);
            } catch (err) {
              console.error('Approve error:', err);
            }
          }}
          onRejectRequest={async (eventId: string, requestId: string) => {
            try {
              await axios.post(
                `${API}/api/events/${eventId}/reject-request/${requestId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const refreshed = await axios.get(`${API}/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setParticipantsModalEvent(refreshed.data);
            } catch (err) {
              console.error('Reject error:', err);
            }
          }}
          currentUserId={currentUserId}
          isOrganizer={participantsModalEvent?.organizer?._id === currentUserId}
        />
      )}
    </div>
  );
}
