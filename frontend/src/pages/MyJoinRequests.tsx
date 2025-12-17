// My Join Requests - Dedicated Page
import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { 
  Clock, RefreshCw, CheckCircle, XCircle, AlertCircle, 
  Loader, ArrowLeft, Calendar, MapPin, User, DollarSign,
  FileText
} from "lucide-react";

dayjs.extend(relativeTime);

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface SimpleBooking {
  _id: string;
  status: "pending" | "approved" | "rejected";
  transactionCode: string;
  isPaid: boolean;
  rejectionReason: string;
  event: {
    _id: string;
    title: string;
    startDate: string;
    location?: { name: string; city?: string; state?: string };
    organizer: {
      _id: string;
      username: string;
      avatar?: string;
    };
    pricing?: {
      amount: number;
      currency: string;
    };
  };
  createdAt: string;
}

export default function MyJoinRequests({ onBack, onNavigate }: any) {
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API}/api/bookings-simple/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error("[MyJoinRequests] Error:", err);
      setError(err.response?.data?.error || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "pending": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "rejected": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings.filter(b => 
    filter === "all" || b.status === filter
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    approved: bookings.filter(b => b.status === "approved").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                My Join Requests
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your event join requests and their status
              </p>
            </div>
            
            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{stats.pending}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-1">Approved</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{stats.approved}</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
            <p className="text-sm text-rose-700 dark:text-rose-400 mb-1">Rejected</p>
            <p className="text-2xl font-bold text-rose-900 dark:text-rose-300">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === status
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white dark:bg-[#0f172a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-blue-500"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {filter !== "all" ? filter : ""} requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "all" 
                ? "You haven't joined any events yet"
                : `You don't have any ${filter} requests`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Event Title */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {booking.event?.title || ''}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        {booking.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span>{dayjs(booking.event.startDate).format("MMM D, YYYY")}</span>
                      </div>
                      
                      {booking.event.location && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>
                            {booking.event.location.city || booking.event.location.name}
                            {booking.event.location.state && `, ${booking.event.location.state}`}
                          </span>
                        </div>
                      )}

                      <div 
                        onClick={() => onNavigate && onNavigate('profile', booking.event.organizer._id)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-500" />
                        <span>By <span className="font-semibold">{booking.event.organizer.username}</span></span>
                      </div>

                      {booking.event.pricing && booking.event.pricing.amount > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-semibold">
                            {booking.event.pricing.currency} {booking.event.pricing.amount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Transaction Code */}
                    {booking.transactionCode && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Transaction: <span className="font-mono font-semibold">{booking.transactionCode}</span>
                        </span>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {booking.status === "rejected" && booking.rejectionReason && (
                      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
                        <p className="text-sm text-rose-700 dark:text-rose-400">
                          <span className="font-semibold">Reason:</span> {booking.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Submitted Time */}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Submitted {dayjs(booking.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
