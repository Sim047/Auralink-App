// frontend/src/components/CreateEventModal.tsx
import React, { useState } from "react";
import axios from "axios";
import { X, Calendar, MapPin, Users, DollarSign, Clock, Trophy } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const SPORTS = [
  "Football", "Basketball", "Tennis", "Swimming", "Volleyball",
  "Hockey", "Baseball", "Cricket", "Rugby", "Golf",
  "Badminton", "Table Tennis", "Boxing", "Athletics", "Cycling",
  "Yoga", "Martial Arts", "Gymnastics", "Skiing", "Skating"
];

const EVENT_TYPES = [
  { value: "tournament", label: "🏆 Tournament" },
  { value: "clinic", label: "🎓 Clinic" },
  { value: "workshop", label: "🛠️ Workshop" },
  { value: "bootcamp", label: "💪 Bootcamp" },
  { value: "social", label: "🤝 Social" },
];

const SKILL_LEVELS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function CreateEventModal({ isOpen, onClose, token, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "Football",
    eventType: "tournament",
    startDate: "",
    endDate: "",
    time: "",
    locationName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    maxCapacity: 20,
    pricingType: "free",
    amount: 0,
    skillLevel: "all",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        sport: formData.sport,
        eventType: formData.eventType,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(formData.startDate).toISOString(),
        time: formData.time,
        location: {
          name: formData.locationName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
        },
        capacity: {
          max: Number(formData.maxCapacity),
          current: 0,
        },
        pricing: {
          type: formData.pricingType,
          amount: formData.pricingType === "paid" ? Number(formData.amount) : 0,
          currency: "USD",
        },
        skillLevel: formData.skillLevel,
        status: "published",
      };

      await axios.post(`${API}/api/events`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onSuccess && onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        sport: "Football",
        eventType: "tournament",
        startDate: "",
        endDate: "",
        time: "",
        locationName: "",
        address: "",
        city: "",
        state: "",
        country: "",
        maxCapacity: 20,
        pricingType: "free",
        amount: 0,
        skillLevel: "all",
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create New Event</h2>
            <p className="text-white/90 text-sm">Share your event with the community</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-teal-500" />
              Event Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                placeholder="e.g., Summer Basketball Tournament"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                placeholder="Describe your event..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sport *
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                >
                  {SPORTS.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type *
                </label>
                <select
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skill Level
                </label>
                <select
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              Date & Time
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-500" />
              Location
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Venue Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="e.g., Central Sports Complex"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" />
              Capacity & Pricing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Participants *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pricing Type
                </label>
                <select
                  value={formData.pricingType}
                  onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {formData.pricingType === "paid" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-teal-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
