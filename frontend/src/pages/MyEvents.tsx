// frontend/src/pages/MyEvents.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  DollarSign,
  Trophy,
} from "lucide-react";
import CreateEventModal from "../components/CreateEventModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function MyEvents({ token }: any) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadMyEvents();
  }, [token]);

  async function loadMyEvents() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/events/my/created`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(res.data.events || []);
    } catch (err) {
      console.error("Load my events error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      setDeletingId(eventId);
      await axios.delete(`${API}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(events.filter((e) => e._id !== eventId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(event: any) {
    setEditingEvent(event);
    setCreateModalOpen(true);
  }

  function handleCreateSuccess() {
    loadMyEvents();
    setEditingEvent(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#071029] dark:via-[#0a1435] dark:to-[#071029] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Events
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage events you've created
            </p>
          </div>
          <button
            onClick={() => {
              setEditingEvent(null);
              setCreateModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Participants</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {events.reduce((sum, e) => sum + (e.capacity?.current || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {events.filter((e) => e.status === "published").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You haven't created any events. Start by creating your first event!
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
              >
                {/* Event Header */}
                <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.sport && (
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium">
                          {event.sport}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                        title="Edit Event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event._id)}
                        disabled={deletingId === event._id}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-white disabled:opacity-50"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-6 space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>
                        {dayjs(event.startDate).format("MMM D, YYYY")}
                        {event.time && ` at ${event.time}`}
                      </span>
                    </div>

                    {event.location?.city && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>
                          {event.location.name && `${event.location.name}, `}
                          {event.location.city}
                          {event.location.state && `, ${event.location.state}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>
                        {event.capacity?.current || 0} / {event.capacity?.max || 0} participants
                      </span>
                      {event.waitlist?.length > 0 && (
                        <span className="text-orange-500 text-xs">
                          ({event.waitlist.length} on waitlist)
                        </span>
                      )}
                    </div>

                    {event.pricing?.type === "paid" && (
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span>
                          {event.pricing.currency} {event.pricing.amount}
                        </span>
                      </div>
                    )}

                    {event.pricing?.type === "free" && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Free Event</span>
                      </div>
                    )}
                  </div>

                  {/* Status & Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        event.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : event.status === "draft"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      Created {dayjs(event.createdAt).fromNow()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingEvent(null);
        }}
        token={token}
        onSuccess={handleCreateSuccess}
        editingEvent={editingEvent}
      />
    </div>
  );
}
