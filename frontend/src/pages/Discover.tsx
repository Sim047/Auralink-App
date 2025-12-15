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

dayjs.extend(relativeTime);

type CategoryType = "sports" | "services" | "marketplace" | null;

interface Event {
  _id: string;
  title: string;
  sport: string;
  description: string;
  date: string;
  time: string;
  location: string;
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

export default function Discover() {
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
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

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
    try {
      await axios.post(`${API_URL}/events/${eventId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to join event");
    }
  };

  const handleLikeItem = async (itemId: string) => {
    try {
      await axios.post(`${API_URL}/marketplace/${itemId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarketplaceItems();
      // Update the selected product if modal is open
      if (selectedProduct && selectedProduct._id === itemId) {
        const response = await axios.get(`${API_URL}/marketplace/${itemId}`);
        setSelectedProduct(response.data);
      }
    } catch (error) {
      console.error("Error liking item:", error);
    }
  };

  const handleLikeService = async (serviceId: string) => {
    try {
      await axios.post(`${API_URL}/services/${serviceId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchServices();
      // Update the selected service if modal is open
      if (selectedService && selectedService._id === serviceId) {
        const response = await axios.get(`${API_URL}/services/${serviceId}`);
        setSelectedService(response.data);
      }
    } catch (error) {
      console.error("Error liking service:", error);
    }
  };

  const handleMessageUser = async (userId: string) => {
    try {
      if (!token) {
        alert("Please log in to send messages");
        return;
      }
      
      // Create or get conversation with this user
      const response = await axios.post(`${API_URL}/conversations`, 
        { partnerId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const conversation = response.data;
      
      // Store the active conversation and DM state
      localStorage.setItem("auralink-active-conversation", JSON.stringify(conversation));
      localStorage.setItem("auralink-in-dm", "true");
      
      // Reload the page to navigate to main view with conversation active
      window.location.href = "/";
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      const message = error.response?.data?.message || "Failed to start conversation. Please try again.";
      alert(message);
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
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-cyan-400/50 transition-all hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                      <p className="text-sm text-cyan-400">{event.sport}</p>
                    </div>
                    {event.cost && (
                      <div className="bg-green-500/20 px-3 py-1 rounded-full">
                        <span className="text-green-400 font-semibold text-sm">${event.cost}</span>
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
                      {event.location?.city || event.location?.name || event.location?.address || "Location TBA"}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-cyan-400" />
                      {event.participants.length}/{event.maxParticipants} participants
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinEvent(event._id)}
                    disabled={event.participants.some((p: any) => p._id === currentUser._id)}
                    className={`w-full py-2 rounded-lg font-semibold transition-all ${
                      event.participants.some((p: any) => p._id === currentUser._id)
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-purple-600 text-white hover:from-cyan-600 hover:to-purple-700"
                    }`}
                  >
                    {event.participants.some((p: any) => p._id === currentUser._id) ? "Joined" : "Join Event"}
                  </button>
                </div>
              ))}
            </div>
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
        </div>
      </div>
    );
  }

  return null;
}
