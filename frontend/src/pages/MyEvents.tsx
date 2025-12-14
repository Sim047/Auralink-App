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

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

type TabType = "events" | "services" | "products";

export default function MyEvents({ token }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [events, setEvents] = useState<any[]>([]);
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

  useEffect(() => {
    if (!token) return;
    loadMyEvents();
    loadMyServices();
    loadMyProducts();
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
      setEvents(events.filter((e) => e._id !== eventId));
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
    loadMyEvents();
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
              My Activities
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage events and services you've created
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
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("events")}
            data-tab="events"
            className={`px-6 py-3 font-semibold transition-all relative whitespace-nowrap ${
              activeTab === "events"
                ? "text-cyan-600 dark:text-cyan-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Trophy className="inline w-5 h-5 mr-2" />
            My Events ({events.length})
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
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Services</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{services.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Services</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {services.filter((s) => s.active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg. Rating</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {services.length > 0
                      ? (services.reduce((sum, s) => sum + (s.rating?.average || 0), 0) / services.length).toFixed(1)
                      : "0.0"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "events" ? (
          events.length === 0 ? (
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
          )
        ) : activeTab === "services" ? (
          // Services Tab Content
          services.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Services Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                  className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
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
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Trophy className="w-4 h-4 text-purple-500" />
                        <span>{service.sport}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>
                          ${service.pricing.amount} / {service.pricing.type.replace(/-/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-pink-500" />
                        <span className="capitalize">
                          {service.location.type === "online"
                            ? "Online"
                            : service.location.city || service.location.type}
                        </span>
                      </div>

                      {service.duration && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                            +{service.qualifications.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status & Meta */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Created {dayjs(service.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Products Tab Content
          products.length === 0 ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-3xl p-12 border border-gray-200 dark:border-gray-800 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900 dark:to-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Products Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
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
                  className="bg-white dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300"
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
                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-lg">
                          {product.price} {product.currency || "USD"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Package className="w-4 h-4 text-green-500" />
                        <span className="capitalize">{product.condition}</span>
                      </div>

                      {product.location && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="w-4 h-4 text-green-500" />
                          <span>{product.location}</span>
                        </div>
                      )}

                      {product.shippingAvailable && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Truck className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            Shipping Available
                            {product.shippingCost > 0 && ` (${product.currency} ${product.shippingCost})`}
                          </span>
                        </div>
                      )}

                      {product.quantity && (
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                            +{product.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status & Meta */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
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
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">{product.views || 0}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        Created {dayjs(product.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
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
    </div>
  );
}
