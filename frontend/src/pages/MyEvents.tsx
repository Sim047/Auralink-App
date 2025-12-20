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
  Stethoscope,
  Star,
  ShoppingBag,
  Package,
  Eye,
  Truck,
} from "lucide-react";
import CreateEventModal from "../components/CreateEventModal";
import CreateServiceModal from "../components/CreateServiceModal";
import CreateProductModal from "../components/CreateProductModal";
import EventParticipantsModal from "../components/EventParticipantsModal";

const API = import.meta.env.VITE_API_URL || "";

type TabType = "events" | "services" | "products";

export default function MyEvents({ token }: any) {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('auralink-my-activities-tab') as TabType | null;
    return (saved as TabType) || 'events';
  });
  const [hideInactiveEvents, setHideInactiveEvents] = useState<boolean>(true);
  const [eventsCreated, setEventsCreated] = useState<any[]>([]);
  const [eventsJoined, setEventsJoined] = useState<any[]>([]);
  const [eventsPending, setEventsPending] = useState<any[]>([]);
  const [eventsTab, setEventsTab] = useState<'organizing' | 'joined' | 'pending'>('organizing');
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false);
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [participantsModalEvent, setParticipantsModalEvent] = useState<any>(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) return;
    loadMyEventsAll();
    loadMyServices();
    loadMyProducts();
    // Consume default tab hint provided by dashboard
    const hint = localStorage.getItem('auralink-my-activities-tab') as TabType | null;
    if (hint) {
      setActiveTab(hint);
      localStorage.removeItem('auralink-my-activities-tab');
    }
  }, [token]);

  async function loadMyEventsAll() {
    try {
      setLoading(true);
      const [createdRes, joinedRes, pendingRes] = await Promise.all([
        axios.get(`${API}/api/events/my/created`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/events/my/joined`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/events/my/pending`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setEventsCreated(createdRes.data.events || []);
      setEventsJoined(joinedRes.data.events || []);
      setEventsPending(pendingRes.data.events || []);
    } catch (err) {
      console.error("Load my events error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyServices() {
    try {
      const res = await axios.get(`${API}/api/services/my/created`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data.services || []);
    } catch (err) {
      console.error("Load my services error:", err);
    }
  }

  async function loadMyProducts() {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await axios.get(`${API}/api/marketplace/user/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error("Load my products error:", err);
    }
  }

  async function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      setDeletingId(eventId);
      await axios.delete(`${API}/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventsCreated((prev) => prev.filter((e) => e._id !== eventId));
      setEventsJoined((prev) => prev.filter((e) => e._id !== eventId));
      setEventsPending((prev) => prev.filter((e) => e._id !== eventId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteService(serviceId: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      setDeletingId(serviceId);
      await axios.delete(`${API}/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(services.filter((s) => s._id !== serviceId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setDeletingId(productId);
      await axios.delete(`${API}/api/marketplace/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(event: any) {
    setEditingEvent(event);
    setCreateModalOpen(true);
  }

  function handleEditService(service: any) {
    setEditingService(service);
    setCreateServiceModalOpen(true);
  }

  function handleCreateSuccess() {
    loadMyEventsAll();
    setEditingEvent(null);
  }

  function handleServiceCreateSuccess() {
    loadMyServices();
    setEditingService(null);
  }

  function handleEditProduct(product: any) {
    setEditingProduct(product);
    setCreateProductModalOpen(true);
  }

  function handleProductCreateSuccess() {
    loadMyProducts();
    setEditingProduct(null);
  }

  async function handleApproveRequest(eventId: string, requestId: string) {
    try {
      const res = await axios.post(
        `${API}/api/events/${eventId}/approve-request/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Request approved!");
      loadMyEventsAll();
      if (participantsModalEvent && participantsModalEvent._id === eventId) {
        const updatedEvent = await axios.get(`${API}/api/events/${eventId}`);
        setParticipantsModalEvent(updatedEvent.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to approve request");
    }
  }

  async function handleRejectRequest(eventId: string, requestId: string) {
    try {
      const res = await axios.post(
        `${API}/api/events/${eventId}/reject-request/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || "Request rejected!");
      loadMyEventsAll();
      if (participantsModalEvent && participantsModalEvent._id === eventId) {
        const updatedEvent = await axios.get(`${API}/api/events/${eventId}`);
        setParticipantsModalEvent(updatedEvent.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to reject request");
    }
  }

  function handleMessageUser(userId: string) {
    // TODO: Implement messaging - integrate with your chat system
    console.log("Message user:", userId);
    alert("Messaging feature coming soon!");
  }

  function handleViewProfile(userId: string) {
    // TODO: Implement profile viewing
    console.log("View profile:", userId);
    alert("Profile viewing coming soon!");
  }

  if (loading) {
    return (
      <div className="min-h-screen themed-page p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 rounded w-1/3" style={{ background: 'var(--muted)' }}></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl themed-card"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen themed-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-heading mb-2">
              My Activities
            </h1>
            <p className="text-theme-secondary">
              Manage your events, services, and product listings
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === "events") {
                setEditingEvent(null);
                setCreateModalOpen(true);
              } else if (activeTab === "services") {
                setEditingService(null);
                setCreateServiceModalOpen(true);
              } else {
                setEditingProduct(null);
                setCreateProductModalOpen(true);
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {activeTab === "events" ? "Create Event" : activeTab === "services" ? "Create Service" : "Sell Product"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab("events")}
            data-tab="events"
            className={`px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "events"
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-theme-secondary hover:text-heading"
            }`}
          >
            <Trophy className="inline w-5 h-5 mr-2" />
            My Events ({(eventsCreated.length)})
            {activeTab === "events" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("services")}
            data-tab="services"
            className={`px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "services"
                ? "text-purple-600 dark:text-purple-400"
                : "text-theme-secondary hover:text-heading"
            }`}
          >
            <Stethoscope className="inline w-5 h-5 mr-2" />
            My Services ({services.length})
            {activeTab === "services" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("products")}
            data-tab="products"
            className={`px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "products"
                ? "text-green-600 dark:text-green-400"
                : "text-theme-secondary hover:text-heading"
            }`}
          >
            <ShoppingBag className="inline w-5 h-5 mr-2" />
            My Products ({products.length})
            {activeTab === "products" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
            )}
          </button>
        </div>

        {/* Stats */}
        {activeTab === "events" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-heading">{(eventsCreated.length + eventsJoined.length + eventsPending.length)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Total Participants</p>
                  <p className="text-3xl font-bold text-heading">
                    {[...eventsCreated, ...eventsJoined].reduce((sum, e) => sum + (e.capacity?.current || (e.participants?.length || 0)), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Active Events</p>
                  <p className="text-3xl font-bold text-heading">
                    {[...eventsCreated, ...eventsJoined, ...eventsPending].filter((e) => e.status === "published").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Total Services</p>
                  <p className="text-3xl font-bold text-heading">{services.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Active Services</p>
                  <p className="text-3xl font-bold text-heading">
                    {services.filter((s) => s.active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 themed-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-theme-secondary mb-1">Avg. Rating</p>
                  <p className="text-3xl font-bold text-heading">
                    {services.length > 0
                      ? (services.reduce((sum, s) => sum + (s.rating?.average || 0), 0) / services.length).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {(() => {
          if (activeTab === "events") {
            return (
              <div>
                <div className="mb-6">
                  <div className="inline-flex rounded-xl overflow-hidden themed-card">
                    <button onClick={() => setEventsTab('organizing')} className={`px-4 py-2 text-sm font-semibold ${eventsTab==='organizing' ? 'bg-cyan-500 text-white' : 'text-theme-secondary'}`}>Organizing ({eventsCreated.length})</button>
                    <button onClick={() => setEventsTab('joined')} className={`px-4 py-2 text-sm font-semibold ${eventsTab==='joined' ? 'bg-cyan-500 text-white' : 'text-theme-secondary'}`}>Joined ({eventsJoined.length})</button>
                    <button onClick={() => setEventsTab('pending')} className={`px-4 py-2 text-sm font-semibold ${eventsTab==='pending' ? 'bg-cyan-500 text-white' : 'text-theme-secondary'}`}>Pending ({eventsPending.length})</button>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-theme-secondary">
                      <input
                        type="checkbox"
                        checked={hideInactiveEvents}
                        onChange={(e) => setHideInactiveEvents(e.target.checked)}
                        className="rounded"
                      />
                      Hide drafts/cancelled
                    </label>
                  </div>
                </div>
                {(eventsTab==='organizing' ? eventsCreated : eventsTab==='joined' ? eventsJoined : eventsPending).filter((e:any)=> hideInactiveEvents ? e.status === 'published' : true).length === 0 ? (
                  <div className="rounded-3xl p-12 text-center themed-card">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-xl font-bold text-heading mb-2">
                        No Events Yet
                      </h3>
                      <p className="text-theme-secondary mb-6">
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
                    {(eventsTab==='organizing' ? eventsCreated : eventsTab==='joined' ? eventsJoined : eventsPending)
                      .filter((e:any)=> hideInactiveEvents ? e.status === 'published' : true)
                      .map((event) => (
                      <div
                        key={event._id}
                        className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 themed-card"
                      >
                        {/* Event Header */}
                        <div className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {event.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                {event.sport && (
                                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-xs font-medium">
                                    {event.sport}
                                  </span>
                                )}
                                {event.pricing && (
                                  <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-lg text-xs font-medium">
                                    {event.pricing.type === 'paid' ? `${event.pricing.currency} ${event.pricing.amount}` : 'Free'}
                                  </span>
                                )}
                              </div>
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
                          <p className="text-theme-secondary line-clamp-2">
                            {event.description}
                          </p>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-theme-secondary">
                              <Calendar className="w-4 h-4 text-slate-500" />
                              <span>
                                {dayjs(event.startDate).format("MMM D, YYYY")}
                                {event.time && ` at ${event.time}`}
                              </span>
                            </div>

                              {event.location?.city && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span>
                                  {event.location.name && `${event.location.name}, `}
                                  {event.location.city}
                                  {event.location.state && `, ${event.location.state}`}
                                </span>
                              </div>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-theme-secondary">
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
                              
                              {/* PROMINENT MANAGE PARTICIPANTS BUTTON */}
                              <button
                                onClick={async () => {
                                  try {
                                    const resp = await axios.get(`${API}/api/events/${event._id}`);
                                    setParticipantsModalEvent(resp.data);
                                  } catch (e) {
                                    console.error("[MyEvents] Failed to fetch event for participants modal, using existing data:", e);
                                    setParticipantsModalEvent(event);
                                  }
                                }}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold rounded-lg transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                              >
                                <Users className="w-4 h-4" />
                                Manage Participants
                                {event.joinRequests?.filter((r: any) => r.status === "pending").length > 0 && (
                                  <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                                    {event.joinRequests.filter((r: any) => r.status === "pending").length}
                                  </span>
                                )}
                              </button>
                            </div>

                            {event.pricing && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                {event.pricing.type === 'paid' ? (
                                  <DollarSign className="w-4 h-4 text-slate-500" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-green-500" />
                                )}
                                <span>
                                  {event.pricing.type === 'paid' ? `${event.pricing.currency} ${event.pricing.amount}` : 'Free'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status & Meta */}
                          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
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
                            <span className="text-xs text-theme-secondary">
                              Created {dayjs(event.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          } else if (activeTab === "services") {
            return (
              <>
                {/* Services Tab Content */}
                {services.length === 0 ? (
                  <div className="rounded-3xl p-12 text-center themed-card">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Stethoscope className="w-10 h-10 text-purple-500" />
                      </div>
                      <h3 className="text-xl font-bold text-heading mb-2">
                        No Services Yet
                      </h3>
                      <p className="text-theme-secondary mb-6">
                        You haven't created any services. Start by offering your first service!
                      </p>
                      <button
                        onClick={() => setCreateServiceModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        Create Your First Service
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <div
                        key={service._id}
                        className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 themed-card"
                      >
                        {/* Service Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {service.name}
                              </h3>
                              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium capitalize">
                                {service.category.replace(/-/g, " ")}
                              </span>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditService(service)}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                title="Edit Service"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(service._id)}
                                disabled={deletingId === service._id}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-white disabled:opacity-50"
                                title="Delete Service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Service Details */}
                        <div className="p-6 space-y-4">
                          <p className="text-theme-secondary line-clamp-2">
                            {service.description}
                          </p>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-theme-secondary">
                              <Trophy className="w-4 h-4 text-purple-500" />
                              <span>{service.sport}</span>
                            </div>

                            <div className="flex items-center gap-2 text-theme-secondary">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span>
                                ${service.pricing.amount} / {service.pricing.type.replace(/-/g, " ")}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-theme-secondary">
                              <MapPin className="w-4 h-4 text-pink-500" />
                              <span className="capitalize">
                                {service.location.type === "online"
                                  ? "Online"
                                  : service.location.city || service.location.type}
                              </span>
                            </div>

                            {service.duration && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                <Clock className="w-4 h-4 text-cyan-500" />
                                <span>
                                  {service.duration.value} {service.duration.unit}
                                </span>
                              </div>
                            )}
                          </div>

                          {service.qualifications && service.qualifications.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {service.qualifications.slice(0, 3).map((qual: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded text-xs"
                                >
                                  {qual}
                                </span>
                              ))}
                              {service.qualifications.length > 3 && (
                                <span className="text-xs text-theme-secondary self-center">
                                  +{service.qualifications.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status & Meta */}
                          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  service.active
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                }`}
                              >
                                {service.active ? "Active" : "Inactive"}
                              </span>
                              {service.rating?.average > 0 && (
                                <div className="flex items-center gap-1 text-yellow-500">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="text-sm font-medium">
                                    {service.rating.average.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-theme-secondary">
                              Created {dayjs(service.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          } else {
            return (
              <>
                {/* Products Tab Content */}
                {products.length === 0 ? (
                  <div className="rounded-3xl p-12 text-center themed-card">
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-xl font-bold text-heading mb-2">
                        No Products Yet
                      </h3>
                      <p className="text-theme-secondary mb-6">
                        You haven't listed any products. Start selling your sports gear and merchandise!
                      </p>
                      <button
                        onClick={() => setCreateProductModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        List Your First Product
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 themed-card"
                      >
                        {/* Product Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {product.title}
                              </h3>
                              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm font-medium capitalize">
                                {product.category}
                              </span>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-white"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                disabled={deletingId === product._id}
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-white disabled:opacity-50"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="p-6 space-y-4">
                          <p className="text-theme-secondary line-clamp-2">
                            {product.description}
                          </p>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-theme-secondary">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-semibold text-lg">
                                {product.price} {product.currency || "USD"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-theme-secondary">
                              <Package className="w-4 h-4 text-green-500" />
                              <span className="capitalize">{product.condition}</span>
                            </div>

                            {product.location && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                <MapPin className="w-4 h-4 text-green-500" />
                                <span>{product.location}</span>
                              </div>
                            )}

                            {product.shippingAvailable && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                <Truck className="w-4 h-4 text-blue-500" />
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  Shipping Available
                                  {product.shippingCost > 0 && ` (${product.currency} ${product.shippingCost})`}
                                </span>
                              </div>
                            )}

                            {product.quantity && (
                              <div className="flex items-center gap-2 text-theme-secondary">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span>{product.quantity} available</span>
                              </div>
                            )}
                          </div>

                          {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {product.tags.slice(0, 3).map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {product.tags.length > 3 && (
                                <span className="text-xs text-theme-secondary self-center">
                                  +{product.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Status & Meta */}
                          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  product.status === "active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                }`}
                              >
                                {product.status}
                              </span>
                              {product.views > 0 && (
                                <div className="flex items-center gap-1 text-theme-secondary">
                                  <Eye className="w-4 h-4" />
                                  <span className="text-xs">{product.views}</span>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-theme-secondary">
                              Created {dayjs(product.createdAt).fromNow()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          }
        })()}
      </div>

      {/* Create/Edit Event Modal */}
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

      {/* Create/Edit Service Modal */}
      <CreateServiceModal
        isOpen={createServiceModalOpen}
        onClose={() => {
          setCreateServiceModalOpen(false);
          setEditingService(null);
        }}
        onServiceCreated={handleServiceCreateSuccess}
        token={token}
        editService={editingService}
      />

      {/* Create/Edit Product Modal */}
      <CreateProductModal
        isOpen={createProductModalOpen}
        onClose={() => {
          setCreateProductModalOpen(false);
          setEditingProduct(null);
        }}
        onProductCreated={handleProductCreateSuccess}
        token={token}
        editProduct={editingProduct}
      />

      {/* Event Participants Modal */}
      {participantsModalEvent && (
        <EventParticipantsModal
          event={participantsModalEvent}
          onClose={() => setParticipantsModalEvent(null)}
          onMessage={handleMessageUser}
          onViewProfile={handleViewProfile}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          currentUserId={currentUser._id}
          isOrganizer={true}
        />
      )}
    </div>
  );
}
