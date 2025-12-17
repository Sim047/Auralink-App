// Pending Approvals - Dedicated Page
import { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { 
  RefreshCw, CheckCircle, XCircle, Loader, ArrowLeft, 
  Calendar, DollarSign, User, FileText, AlertCircle,
  CheckSquare, ShieldCheck
} from "lucide-react";

dayjs.extend(relativeTime);

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface SimpleBooking {
  _id: string;
  status: "pending" | "approved" | "rejected";
  transactionCode: string;
  isPaid: boolean;
  user: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  event: {
    _id: string;
    title: string;
    startDate: string;
    pricing?: {
      amount: number;
      currency: string;
    };
  };
  createdAt: string;
}

export default function PendingApprovals({ token, onBack, onNavigate }: any) {
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API}/api/bookings-simple/to-approve`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error("[PendingApprovals] Error:", err);
      setError(err.response?.data?.error || "Failed to load approvals");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(bookingId: string) {
    if (!confirm("Approve this join request?")) return;
    
    try {
      setProcessing(bookingId);
      await axios.post(
        `${API}/api/bookings-simple/${bookingId}/decide`,
        { approved: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadRequests();
    } catch (err: any) {
      console.error("Approve error:", err);
      alert(err.response?.data?.error || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(bookingId: string) {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(bookingId);
      await axios.post(
        `${API}/api/bookings-simple/${bookingId}/decide`,
        { approved: false, rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowRejectionModal(null);
      setRejectionReason("");
      await loadRequests();
    } catch (err: any) {
      console.error("Reject error:", err);
      alert(err.response?.data?.error || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  }

  async function handleVerifyPayment(bookingId: string) {
    if (!confirm("Mark payment as verified?")) return;

    try {
      setProcessing(bookingId);
      await axios.post(
        `${API}/api/bookings-simple/${bookingId}/verify-payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadRequests();
    } catch (err: any) {
      console.error("Verify payment error:", err);
      alert(err.response?.data?.error || "Failed to verify payment");
    } finally {
      setProcessing(null);
    }
  }

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const approvedUnpaid = bookings.filter(
    b => b.status === "approved" && !b.isPaid && b.event.pricing && b.event.pricing.amount > 0
  );

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
                Pending Approvals
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and approve join requests for your events
              </p>
            </div>
            
            <button
              onClick={loadRequests}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-400 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">{pendingBookings.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-400 dark:text-orange-600" />
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Awaiting Payment</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{approvedUnpaid.length}</p>
              </div>
              <ShieldCheck className="w-12 h-12 text-blue-400 dark:text-blue-600" />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
            {error}
          </div>
        ) : pendingBookings.length === 0 && approvedUnpaid.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No pending approvals or payments to verify
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Approvals */}
            {pendingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Pending Approval ({pendingBookings.length})
                </h2>
                <div className="grid gap-4">
                  {pendingBookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white dark:bg-[#0f172a] rounded-2xl border-2 border-orange-200 dark:border-orange-800 p-6 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* User Info */}
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => onNavigate && onNavigate('profile', booking.user._id)}
                              className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:scale-110 transition-transform"
                            >
                              {booking.user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p 
                                onClick={() => onNavigate && onNavigate('profile', booking.user._id)}
                                className="font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {booking.user.username}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">{booking.user.email}</p>
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {booking.event?.title || ''}
                            </h3>
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                {dayjs(booking.event.startDate).format("MMM D, YYYY")}
                              </div>
                              
                              {booking.event.pricing && booking.event.pricing.amount > 0 && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-500" />
                                  <span className="font-semibold">
                                    {booking.event.pricing.currency} {booking.event.pricing.amount}
                                  </span>
                                </div>
                              )}
                            </div>

                            {booking.transactionCode && (
                              <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                  Transaction: <span className="font-mono font-semibold">{booking.transactionCode}</span>
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Requested {dayjs(booking.createdAt).fromNow()}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col gap-3">
                          <button
                            onClick={() => handleApprove(booking._id)}
                            disabled={processing === booking._id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                          >
                            {processing === booking._id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckSquare className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          
                          <button
                            onClick={() => setShowRejectionModal(booking._id)}
                            disabled={processing === booking._id}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awaiting Payment Verification */}
            {approvedUnpaid.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  Awaiting Payment Verification ({approvedUnpaid.length})
                </h2>
                <div className="grid gap-4">
                  {approvedUnpaid.map((booking) => (
                    <div
                      key={booking._id}
                      className="bg-white dark:bg-[#0f172a] rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6"
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <p className="font-bold text-gray-900 dark:text-white">{booking.user.username}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.event.title}</p>
                          {booking.transactionCode && (
                            <p className="text-sm font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                              {booking.transactionCode}
                            </p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleVerifyPayment(booking._id)}
                          disabled={processing === booking._id}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
                        >
                          {processing === booking._id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          Verify Payment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Join Request
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Event is full, Requirements not met..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(null);
                  setRejectionReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectionModal)}
                disabled={!rejectionReason.trim() || processing === showRejectionModal}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === showRejectionModal ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
