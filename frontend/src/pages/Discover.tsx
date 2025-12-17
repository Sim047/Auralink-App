import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ShoppingBag,
  Heart,
  Activity,
  Sparkles,
  Plus,
  Filter,
  X,
  Star,
  Package,
  Stethoscope,
  Dumbbell,
  ArrowRight,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Tag,
  Search,
  ChevronLeft,
  Image as ImageIcon,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { API_URL } from "../config/api";
import ServiceDetailModal from "../components/ServiceDetailModal";
import ProductDetailModal from "../components/ProductDetailModal";
import EventDetailModal from "../components/EventDetailModal";
import EventParticipantsModal from "../components/EventParticipantsModal";
import NotificationToast from "../components/NotificationToast";
import PaymentTransactionModal from "../components/PaymentTransactionModal";

dayjs.extend(relativeTime);

type CategoryType = "sports" | "services" | "marketplace" | null;

interface Event {
  _id: string;
  title: string;
  sport: string;
  description: string;
  date: string;
  time: string;
  location: any;
  maxParticipants: number;
  participants: any[];
  organizer: {
    _id: string;
    username: string;
    avatar?: string;
  };
  requiresApproval: boolean;
  cost?: number;
  skillLevel?: string;
  image?: string;
  pricing?: {
    type: string;
    amount: number;
    currency: string;
    paymentInstructions?: string;
  };
  capacity?: {
    max: number;
    current: number;
  };
}

interface Service {
  _id: string;
  name: string;
  description: string;
  category: string;
  sport?: string;
  pricing: {
    type: string;
    amount: number;
  };
  location: {
    type: string;
    city?: string;
    address?: string;
  };
  provider: {
    _id: string;
    username: string;
    avatar?: string;
  };
  qualifications?: string[];
  experience?: string;
  images?: string[];
  duration?: {
    value: number;
    unit: string;
  };
  requirements?: string[];
  included?: string[];
  views?: number;
  likes?: string[];
}

interface MarketplaceItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  condition: string;
  images: string[];
  location?: string;
  seller: {
    _id: string;
    username: string;
    avatar?: string;
  };
  likes: string[];
  views: number;
  status: string;
  createdAt: string;
}

interface DiscoverProps {
  token: string | null;
  onViewProfile?: (user: any) => void;
  onStartConversation: (userId: string) => void;
}

export default function Discover({ token, onViewProfile, onStartConversation }: DiscoverProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedSport, setSelectedSport] = useState("All Sports");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participantsModalEvent, setParticipantsModalEvent] = useState<Event | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [paymentModalData, setPaymentModalData] = useState<{
    show: boolean;
    event: Event | null;
  }>({ show: false, event: null });
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (activeCategory === "sports") {
      fetchEvents();
    } else if (activeCategory === "services") {
      fetchServices();
    } else if (activeCategory === "marketplace") {
      fetchMarketplaceItems();
    }
  }, [activeCategory, selectedSport, filterCategory]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const sport = selectedSport === "All Sports" ? "" : selectedSport;
      const response = await axios.get(`${API_URL}/events?sport=${sport}`);
      setEvents(response.data.events || response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = filterCategory ? `?category=${filterCategory}` : "";
      const response = await axios.get(`${API_URL}/services${params}`);
      setServices(response.data.services || response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketplaceItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.append("category", filterCategory);
      if (searchTerm) params.append("search", searchTerm);
      const response = await axios.get(`${API_URL}/marketplace?${params}`);
      setMarketplaceItems(response.data.items || response.data);
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!token) {
      setNotification({ message: "Please log in to join events", type: "warning" });
      return;
    }
    
    try {
      console.log("[Discover] === JOIN EVENT START ===");
      console.log("[Discover] Event ID:", eventId);
      
      // Find the event to check if it's paid
      const event = events.find(e => e._id === eventId) || selectedEvent;
      console.log("[Discover] Event found:", event);
      console.log("[Discover] Event pricing:", event?.pricing);
      console.log("[Discover] Is paid event?", event?.pricing?.type === "paid");
      
      // If event has pricing and is paid, show payment modal
      if (event && event.pricing?.type === "paid") {
        setPaymentModalData({ show: true, event });
        return; // Wait for modal submission
      }
      
      // Free event - proceed directly
      const response = await axios.post(
        `${API_URL}/events/${eventId}/join`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[Discover] Join event response:", response.data);
      
      // Show success message with proper notification
      const message = response.data.message || "Successfully joined event!";
      const requiresApproval = response.data.requiresApproval;
      
      setNotification({ 
        message: requiresApproval 
          ? "✅ Join request submitted! The organizer will review your request."
          : message,
        type: "success" 
      });
      
      // Refresh events list
      await fetchEvents();
      
      // Update selected event if modal is open
      if (selectedEvent && selectedEvent._id === eventId) {
        try {
          const updatedEvent = await axios.get(`${API_URL}/events/${eventId}`);
          setSelectedEvent(updatedEvent.data);
        } catch (err) {
          console.error("Failed to refresh event details:", err);
        }
      }
    } catch (error: any) {
      console.error("[Discover] Join event error:", error);
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to join event";
      setNotification({ message, type: "error" });
    }
  };

  const handlePaymentSubmit = async (transactionCode: string, transactionDetails: string) => {
    if (!paymentModalData.event) return;
    
    try {
      const response = await axios.post(
        `${API_URL}/events/${paymentModalData.event._id}/join`,
        {
          transactionCode,
          transactionDetails
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("[Discover] Join paid event response:", response.data);
      
      // Close payment modal
      setPaymentModalData({ show: false, event: null });
      
      // Show success notification
      const requiresApproval = response.data.requiresApproval;
      setNotification({
        message: requiresApproval
          ? "✅ Join request submitted! The organizer will verify your payment and approve your request."
          : "✅ Successfully joined event!",
        type: "success"
      });
      
      // Refresh events list
      await fetchEvents();
      
      // Update selected event if modal is open
      if (selectedEvent && selectedEvent._id === paymentModalEvent._id) {
        try {
          const updatedEvent = await axios.get(`${API_URL}/events/${paymentModalEvent._id}`);
          setSelectedEvent(updatedEvent.data);
        } catch (err) {
          console.error("Failed to refresh event details:", err);
        }
      }
    } catch (error: any) {
      conShowPaymentModal(false);
      setPaymentModalEvent(null);
      setNotification({
        message: error.response?.data?.message || error.response?.data?.error || "Failed to submit join request",
        type: "error"
      });
    }
  };

  const handlePaymentCancel = () => {
    console.log("[Discover] Payment modal cancelled");
    setShowPaymentModal(false);
    setPaymentModalEvent(null);
  };

  const handleApproveRequest = async (eventId: string, requestId: string) => {
    if (!token) {
      setNotification({ message: "Please log in to manage requests", type: "warning" });
      return;
    }
    
    try {
      console.log("[Discover] Approving request:", { eventId, requestId });
      const response = await axios.post(
        `${API_URL}/events/${eventId}/approve-request/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[Discover] Approve response:", response.data);
      setNotification({ 
        message: response.data.message || "✅ Request approved! Participant added to event.", 
        type: "success" 
      });
      
      // Refresh event data
      await fetchEvents();
      
      // Update participants modal with fresh data
      if (participantsModalEvent && participantsModalEvent._id === eventId) {
        try {
          const updatedEventResponse = await axios.get(`${API_URL}/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("[Discover] Updated event data:", updatedEventResponse.data);
          setParticipantsModalEvent(updatedEventResponse.data);
        } catch (err) {
          console.error("[Discover] Failed to fetch updated event:", err);
        }
      }
      
      // Update selected event if detail modal is open
      if (selectedEvent && selectedEvent._id === eventId) {
        try {
          const updatedEventResponse = await axios.get(`${API_URL}/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelectedEvent(updatedEventResponse.data);
        } catch (err) {
          console.error("[Discover] Failed to update selected event:", err);
        }
      }
    } catch (error: any) {
      console.error("[Discover] Approve request error:", error);
      setNotification({ 
        message: error.response?.data?.error || error.response?.data?.message || "Failed to approve request", 
        type: "error" 
      });
    }
  };

  const handleRejectRequest = async (eventId: string, requestId: string) => {
    if (!token) {
      setNotification({ message: "Please log in to manage requests", type: "warning" });
      return;
    }
    
    try {
      console.log("[Discover] Rejecting request:", { eventId, requestId });
      const response = await axios.post(
        `${API_URL}/events/${eventId}/reject-request/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[Discover] Reject response:", response.data);
      setNotification({ 
        message: response.data.message || "Request rejected", 
        type: "info" 
      });
      
      // Refresh event data
      await fetchEvents();
      
      // Update participants modal with fresh data
      if (participantsModalEvent && participantsModalEvent._id === eventId) {
        try {
          const updatedEventResponse = await axios.get(`${API_URL}/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("[Discover] Updated event data after rejection:", updatedEventResponse.data);
          setParticipantsModalEvent(updatedEventResponse.data);
        } catch (err) {
          console.error("[Discover] Failed to fetch updated event:", err);
        }
      }
      
      // Update selected event if detail modal is open
      if (selectedEvent && selectedEvent._id === eventId) {
        try {
          const updatedEventResponse = await axios.get(`${API_URL}/events/${eventId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSelectedEvent(updatedEventResponse.data);
        } catch (err) {
          console.error("[Discover] Failed to update selected event:", err);
        }
      }
    } catch (error: any) {
      console.error("[Discover] Reject request error:", error);
      setNotification({ 
        message: error.response?.data?.error || error.response?.data?.message || "Failed to reject request", 
        type: "error" 
      });
    }
  };

  const handleLikeItem = async (itemId: string) => {
    if (!token) {
      setNotification({ message: "Please log in to like items", type: "warning" });
      return;
    }
    
    try {
      console.log("[Discover] Liking item:", itemId);
      const response = await axios.post(
        `${API_URL}/marketplace/${itemId}/like`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[Discover] Like response:", response.data);
      
      fetchMarketplaceItems();
      
      // Update the selected product if modal is open
      if (selectedProduct && selectedProduct._id === itemId) {
        const productResponse = await axios.get(`${API_URL}/marketplace/${itemId}`);
        setSelectedProduct(productResponse.data);
      }
    } catch (error: any) {
      console.error("[Discover] Error liking item:", error);
      setNotification({ 
        message: error.response?.data?.message || "Failed to like item", 
        type: "error" 
      });
    }
  };

  const handleLikeService = async (serviceId: string) => {
    if (!token) {
      setNotification({ message: "Please log in to like services", type: "warning" });
      return;
    }
    
    try {
      console.log("[Discover] Liking service:", serviceId);
      const response = await axios.post(
        `${API_URL}/services/${serviceId}/like`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("[Discover] Like service response:", response.data);
      
      fetchServices();
      
      // Update the selected service if modal is open
      if (selectedService && selectedService._id === serviceId) {
        const serviceResponse = await axios.get(`${API_URL}/services/${serviceId}`);
        setSelectedService(serviceResponse.data);
      }
    } catch (error: any) {
      console.error("[Discover] Error liking service:", error);
      setNotification({ 
        message: error.response?.data?.message || "Failed to like service", 
        type: "error" 
      });
    }
  };

  const handleMessageUser = async (userId: string) => {
    console.log("[Discover] handleMessageUser called with userId:", userId);
    
    if (!token) {
      setNotification({ message: "Please log in to send messages", type: "warning" });
      return;
    }
    
    // Use the callback if available
    if (onStartConversation) {
      console.log("[Discover] Using onStartConversation callback");
      onStartConversation(userId);
      return;
    }
    
    // Fallback: create conversation directly
    console.log("[Discover] Fallback: creating conversation directly");
    try {
      const response = await axios.post(
        `${API_URL}/conversations`,
        { partnerId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const conversation = response.data;
      console.log("[Discover] Conversation created:", conversation);
      
      // Store in localStorage
      localStorage.setItem("auralink-active-conversation", JSON.stringify(conversation));
      localStorage.setItem("auralink-in-dm", "true");
      
      // Navigate to main view
      setNotification({ message: "Opening conversation...", type: "info" });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error: any) {
      console.error("[Discover] Error creating conversation:", error);
      setNotification({ 
        message: error.response?.data?.message || "Failed to start conversation", 
        type: "error" 
      });
    }
  };

  // Hub Landing Page
  if (!activeCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-4">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">More</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Explore sports events, professional services, and marketplace
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sports Events Card */}
            <div
              onClick={() => setActiveCategory("sports")}
              className="group cursor-pointer bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-3">
                Sports Events
              </h2>
              <p className="text-gray-300 text-center mb-6">
                Find and join sports activities, tournaments, and training sessions
              </p>
              <div className="flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <span className="font-semibold">Explore Events</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Medical Services Card */}
            <div
              onClick={() => setActiveCategory("services")}
              className="group cursor-pointer bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-3">
                Medical Services
              </h2>
              <p className="text-gray-300 text-center mb-6">
                Physiotherapy, massage, nutrition, personal training & more
              </p>
              <div className="flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="font-semibold">Browse Services</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Marketplace Card */}
            <div
              onClick={() => setActiveCategory("marketplace")}
              className="group cursor-pointer bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-lg rounded-2xl p-8 border border-green-500/20 hover:border-green-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShoppingBag className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-3">
                Marketplace
              </h2>
              <p className="text-gray-300 text-center mb-6">
                Buy and sell sports equipment, apparel, supplements & gear
              </p>
              <div className="flex items-center justify-center text-green-400 group-hover:text-green-300 transition-colors">
                <span className="font-semibold">Shop Now</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {events.length || "—"}
              </div>
              <div className="text-gray-400 text-sm mt-1">Active Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                {services.length || "—"}
              </div>
              <div className="text-gray-400 text-sm mt-1">Services Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {marketplaceItems.length || "—"}
              </div>
              <div className="text-gray-400 text-sm mt-1">Items for Sale</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sports Events View
  if (activeCategory === "sports") {
    const sportsList = ["All Sports", "Football", "Basketball", "Tennis", "Running", "Swimming", "Cycling", "Gym", "Volleyball", "Baseball"];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button & Header */}
          <div className="mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center text-gray-300 hover:text-white mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Discover
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              Sports Events <Trophy className="inline w-8 h-8 text-cyan-400 ml-2" />
            </h1>
            <p className="text-gray-300">Join sports activities and meet new people</p>
          </div>

          {/* Sport Filter */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {sportsList.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedSport === sport
                    ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="text-center text-gray-300 py-12">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No events found for {selectedSport}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                      <p className="text-sm text-cyan-400">{event.sport}</p>
                    </div>
                    {(event.cost || event.pricing?.amount) && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        <span className="text-green-400 font-semibold text-sm">
                          {event.pricing?.currency || "$"}{event.pricing?.amount || event.cost}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      {dayjs(event.date).format("MMM D, YYYY")} at {event.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                      {event.location?.city || event.location?.name || event.location?.address || event.location || "Location TBA"}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-cyan-400" />
                      {event.participants.length}/{event.maxParticipants} participants
                    </div>
                    {event.organizer && (
                      <div className="flex items-center">
                        <img
                          src={event.organizer.avatar || `https://ui-avatars.com/api/?name=${event.organizer.username}`}
                          alt={event.organizer.username}
                          className="w-5 h-5 rounded-full mr-2 border border-cyan-400"
                        />
                        <span className="text-gray-400 text-xs">by {event.organizer.username}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinEvent(event._id);
                    }}
                    disabled={event.participants.some((p: any) => p._id === currentUser._id || p === currentUser._id)}
                    className={`w-full py-2 rounded-lg font-semibold transition-all ${
                      event.participants.some((p: any) => p._id === currentUser._id || p === currentUser._id)
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700"
                    }`}
                  >
                    {event.participants.some((p: any) => p._id === currentUser._id || p === currentUser._id) ? "Joined" : "Join Event"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Event Detail Modal */}
          {selectedEvent && (
            <EventDetailModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onJoin={handleJoinEvent}
              onMessage={handleMessageUser}
              onViewProfile={onViewProfile}
              onViewParticipants={(event) => {
                setParticipantsModalEvent(event);
                setSelectedEvent(null);
              }}
              currentUserId={currentUser._id}
            />
          )}
          
          {/* Event Participants Modal */}
          {participantsModalEvent && (
            <EventParticipantsModal
              event={participantsModalEvent}
              onClose={() => setParticipantsModalEvent(null)}
              onMessage={handleMessageUser}
              onViewProfile={onViewProfile}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              currentUserId={currentUser._id}
              isOrganizer={participantsModalEvent.organizer._id === currentUser._id}
            />
          )}
        </div>
      </div>
    );
  }

  // Medical Services View
  if (activeCategory === "services") {
    const servicesList = [
      "All", "personal-training", "group-classes", "nutrition", 
      "physiotherapy", "sports-massage", "mental-coaching", "technique-analysis"
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button & Header */}
          <div className="mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center text-gray-300 hover:text-white mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Discover
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Medical Services <Stethoscope className="inline w-8 h-8 text-purple-400 ml-2" />
                </h1>
                <p className="text-gray-300">Find professional health and training services</p>
              </div>
              <button
                onClick={() => window.location.href = "/#/my-events"}
                className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Create Service
              </button>
            </div>
          </div>

          {/* Service Filter */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
            {servicesList.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category === "All" ? "" : category)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all capitalize ${
                  (category === "All" && !filterCategory) || filterCategory === category
                    ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {category.replace(/-/g, " ")}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center text-gray-300 py-12">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No services found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service._id}
                  onClick={() => setSelectedService(service)}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-all cursor-pointer hover:scale-102"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                      <p className="text-sm text-purple-400 capitalize">{service.category.replace(/-/g, " ")}</p>
                    </div>
                    <div className="bg-green-500/20 px-4 py-2 rounded-full">
                      <span className="text-green-400 font-bold">
                        ${service.pricing.amount}
                        <span className="text-xs font-normal">/{service.pricing.type}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-4">{service.description}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center text-gray-300">
                      <MapPin className="w-4 h-4 mr-2 text-pink-400" />
                      {service.location?.city || service.location?.type || "Location not specified"}
                    </div>
                    {service.experience && (
                      <div className="flex items-center text-gray-300">
                        <Star className="w-4 h-4 mr-2 text-yellow-400" />
                        {service.experience}
                      </div>
                    )}
                  </div>

                  {service.qualifications && service.qualifications.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {service.qualifications.slice(0, 3).map((qual, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs"
                          >
                            {qual}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-gray-400 text-sm mb-4">
                    <img
                      src={service.provider.avatar || `https://ui-avatars.com/api/?name=${service.provider.username}`}
                      alt={service.provider.username}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span>{service.provider.username}</span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessageUser(service.provider._id);
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all"
                  >
                    Contact Provider
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Service Detail Modal */}
          {selectedService && (
            <ServiceDetailModal
              service={selectedService}
              onClose={() => setSelectedService(null)}
              onMessage={handleMessageUser}
              onLike={handleLikeService}
              currentUserId={currentUser._id}
            />
          )}
        </div>
      </div>
    );
  }

  // Marketplace View
  if (activeCategory === "marketplace") {
    const categories = [
      "All", "Sports Equipment", "Apparel & Clothing", "Footwear", 
      "Accessories", "Supplements & Nutrition", "Fitness Tech & Wearables"
    ];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Back Button & Header */}
          <div className="mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center text-gray-300 hover:text-white mb-6 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Discover
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              Marketplace <ShoppingBag className="inline w-8 h-8 text-green-400 ml-2" />
            </h1>
            <p className="text-gray-300">Buy and sell sports equipment and gear</p>
          </div>

          {/* Search & Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMarketplaceItems()}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-400/50"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilterCategory(category === "All" ? "" : category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    (category === "All" && !filterCategory) || filterCategory === category
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Marketplace Grid */}
          {loading ? (
            <div className="text-center text-gray-300 py-12">Loading items...</div>
          ) : marketplaceItems.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No items found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {marketplaceItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-green-400/50 transition-all hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedProduct(item)}
                >
                  {/* Item Image */}
                  <div className="relative h-48 bg-gray-800">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded-full text-xs text-white">
                      {item.condition}
                    </div>
                    {item.images && item.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {item.images.length}
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 mb-2">{item.category}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-green-400">
                        ${item.price}
                        <span className="text-xs text-gray-400 ml-1">{item.currency}</span>
                      </div>
                      <button
                        onClick={() => handleLikeItem(item._id)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            item.likes.includes(currentUser._id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center text-xs text-gray-400 mb-3">
                      <img
                        src={item.seller.avatar || `https://ui-avatars.com/api/?name=${item.seller.username}`}
                        alt={item.seller.username}
                        className="w-5 h-5 rounded-full mr-2"
                      />
                      <span>{item.seller.username}</span>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageUser(item.seller._id);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all"
                    >
                      Contact Seller
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox Preview */}
          {previewImage && (
            <div
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
              onClick={() => setPreviewImage(null)}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Product Detail Modal */}
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              onLike={handleLikeItem}
              onMessage={handleMessageUser}
              currentUserId={currentUser._id}
            />
          )}

          {/* Payment Transaction Modal */}
          {paymentModalData.show && paymentModalData.event && (
            <PaymentTransactionModal
              event={paymentModalData.event}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setPaymentModalData({ show: false, event: null })}
            />
          )}

          {/* Notification Toast */}
          {notification && (
            <NotificationToast
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
