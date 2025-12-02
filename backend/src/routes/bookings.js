// backend/src/routes/bookings.js
import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all bookings for current user (my-bookings endpoint)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;

    const query = { client: req.user.id };

    if (status) query.status = status;
    if (type) query.bookingType = type;

    const bookings = await Booking.find(query)
      .populate("client", "username email avatar")
      .populate("provider", "username email avatar")
      .populate("service", "name category pricing")
      .populate("event", "title sport startDate location")
      .populate({
        path: "coach",
        select: "userId sports",
        populate: {
          path: "userId",
          select: "username email avatar"
        }
      })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ bookings });
  } catch (err) {
    console.error("Get my bookings error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET all bookings for current user
router.get("/", auth, async (req, res) => {
  try {
    const { status, type, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [{ client: req.user.id }, { provider: req.user.id }],
    };

    if (status) query.status = status;
    if (type) query.bookingType = type;

    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const bookings = await Booking.find(query)
      .populate("client", "username email avatar")
      .populate("provider", "username email avatar")
      .populate("service", "name category pricing")
      .populate("event", "title sport startDate")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET single booking
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("client", "username email avatar")
      .populate("provider", "username email avatar")
      .populate("service")
      .populate("event");

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check authorization
    if (
      booking.client.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST create booking
router.post("/", auth, async (req, res) => {
  try {
    const {
      bookingType,
      serviceId,
      eventId,
      providerId,
      scheduledDate,
      scheduledTime,
      location,
      notes,
    } = req.body;

    let bookingData = {
      client: req.user.id,
      bookingType,
      scheduledDate,
      scheduledTime,
      location,
      clientNotes: notes,
    };

    // Handle different booking types
    if (bookingType === "service") {
      const service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      bookingData.service = serviceId;
      bookingData.provider = service.provider;
      bookingData.pricing = {
        amount: service.pricing.amount,
        currency: service.pricing.currency,
      };
      bookingData.duration = service.duration;

      // Increment service booking count
      service.totalBookings += 1;
      await service.save();
    } else if (bookingType === "event") {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      bookingData.event = eventId;
      bookingData.provider = event.organizer;
      bookingData.pricing = {
        amount: event.pricing.amount,
        currency: event.pricing.currency,
      };
    } else if (bookingType === "coach-session") {
      bookingData.provider = providerId;
      bookingData.pricing = req.body.pricing;
      bookingData.duration = req.body.duration;
    }

    const booking = await Booking.create(bookingData);

    await booking.populate("client provider service event");

    res.status(201).json(booking);
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// PUT update booking status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Check authorization
    if (
      booking.client.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }

    booking.status = status;

    if (status === "cancelled") {
      booking.cancelledBy = req.user.id;
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason;
    } else if (status === "completed") {
      booking.completedAt = new Date();
    }

    await booking.save();
    await booking.populate("client provider service event");

    res.json(booking);
  } catch (err) {
    console.error("Update booking status error:", err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});

// POST add rating to booking
router.post("/:id/rate", auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Can only rate completed bookings" });
    }

    // Determine if rating is from client or provider
    if (booking.client.toString() === req.user.id) {
      booking.rating.clientRating = { score: rating, comment };
    } else if (booking.provider.toString() === req.user.id) {
      booking.rating.providerRating = { score: rating, comment };
    } else {
      return res.status(403).json({ error: "Not authorized" });
    }

    await booking.save();

    res.json(booking);
  } catch (err) {
    console.error("Rate booking error:", err);
    res.status(500).json({ error: "Failed to rate booking" });
  }
});

export default router;
