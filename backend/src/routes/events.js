// backend/src/routes/events.js
import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all events with filtering
router.get("/", auth, async (req, res) => {
  try {
    const {
      search,
      sport,
      city,
      eventType,
      skillLevel,
      startDate,
      endDate,
      status = "published",
      featured,
      sortBy = "date",
      order = "asc",
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status };

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filters
    if (sport) query.sport = sport;
    if (city) query["location.city"] = { $regex: city, $options: "i" };
    if (eventType) query.eventType = eventType;
    if (skillLevel) query.skillLevel = skillLevel;
    if (featured === "true") query.featured = true;

    // Date range
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Sorting
    const sortOptions = {};
    if (sortBy === "date") {
      sortOptions.startDate = order === "asc" ? 1 : -1;
    } else if (sortBy === "participants") {
      sortOptions["capacity.current"] = order === "asc" ? 1 : -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .populate("organizer", "username email avatar")
      .populate("participants", "username avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET single event
router.get("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "username email avatar")
      .populate("participants", "username avatar")
      .populate("waitlist", "username avatar");

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// POST create event
router.post("/", auth, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id,
    };

    const event = await Event.create(eventData);
    await event.populate("organizer", "username email avatar");

    res.status(201).json(event);
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// PUT update event
router.put("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    Object.assign(event, req.body);
    await event.save();
    await event.populate("organizer", "username email avatar");

    res.json(event);
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE event
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if user is organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

// GET my events (events created by logged-in user)
router.get("/my/created", auth, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .populate("organizer", "username email avatar")
      .populate("participants", "username avatar")
      .sort({ createdAt: -1 });

    res.json({ events });
  } catch (err) {
    console.error("Get my events error:", err);
    res.status(500).json({ error: "Failed to fetch your events" });
  }
});

// POST join event (create join request with transaction code)
router.post("/:id/join", auth, async (req, res) => {
  try {
    const { transactionCode } = req.body;
    console.log("Join request received:", { eventId: req.params.id, userId: req.user.id, transactionCode });
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already joined
    if (event.participants.includes(req.user.id)) {
      return res.status(400).json({ error: "Already joined this event" });
    }

    // Check if already has pending request
    const existingRequest = event.joinRequests.find(
      request => request.user.toString() === req.user.id && request.status === "pending"
    );
    if (existingRequest) {
      console.log("User already has pending request");
      return res.status(400).json({ error: "You already have a pending join request" });
    }

    // For paid events, require transaction code
    if (event.pricing?.type === "paid" && !transactionCode) {
      return res.status(400).json({ error: "Transaction code is required for paid events" });
    }

    // Create join request
    event.joinRequests.push({
      user: req.user.id,
      transactionCode: transactionCode || "N/A",
      requestedAt: new Date(),
      status: "pending",
    });

    await event.save();
    console.log("Join request created, total requests:", event.joinRequests.length);
    await event.populate("joinRequests.user", "username avatar");

    // Emit socket notification to event organizer
    const io = req.app.get("io");
    if (io) {
      io.emit("join_request_created", {
        eventId: event._id,
        eventTitle: event.title,
        organizerId: event.organizer.toString(),
        requesterId: req.user.id,
      });
    }

    res.json({ message: "Join request submitted", event });
  } catch (err) {
    console.error("Join event error:", err);
    res.status(500).json({ error: "Failed to submit join request" });
  }
});

// POST approve join request
router.post("/:id/approve-request/:requestId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only organizer can approve
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only event organizer can approve requests" });
    }

    const request = event.joinRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    // Check capacity
    if (event.capacity.current >= event.capacity.max) {
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // Approve request
    request.status = "approved";
    event.participants.push(request.user);
    event.capacity.current += 1;
    await event.save();

    await event.populate("participants", "username avatar");
    await event.populate("joinRequests.user", "username avatar");

    // Emit socket notification to requester
    const io = req.app.get("io");
    if (io) {
      io.emit("join_request_approved", {
        eventId: event._id,
        eventTitle: event.title,
        userId: request.user.toString(),
      });
    }

    res.json({ message: "Join request approved", event });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// POST reject join request
router.post("/:id/reject-request/:requestId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Only organizer can reject
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only event organizer can reject requests" });
    }

    const request = event.joinRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({ error: "Join request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed" });
    }

    // Reject request
    request.status = "rejected";
    await event.save();

    await event.populate("joinRequests.user", "username avatar");

    // Emit socket notification to requester
    const io = req.app.get("io");
    if (io) {
      io.emit("join_request_rejected", {
        eventId: event._id,
        eventTitle: event.title,
        userId: request.user.toString(),
      });
    }

    res.json({ message: "Join request rejected", event });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

// GET my join requests (events I've requested to join)
router.get("/my-join-requests", auth, async (req, res) => {
  try {
    console.log("Fetching join requests for user:", req.user.id);
    const events = await Event.find({
      "joinRequests.user": req.user.id,
    })
      .populate("organizer", "username avatar")
      .populate("joinRequests.user", "username avatar");

    console.log("Found events with requests:", events.length);

    const myRequests = events.map(event => {
      const request = event.joinRequests.find(
        r => r.user._id.toString() === req.user.id
      );
      return {
        event: {
          _id: event._id,
          title: event.title,
          startDate: event.startDate,
          location: event.location,
          organizer: event.organizer,
        },
        request,
      };
    });

    console.log("Returning requests:", myRequests.length);
    res.json(myRequests);
  } catch (err) {
    console.error("Get my join requests error:", err);
    res.status(500).json({ error: "Failed to fetch join requests" });
  }
});

// GET pending join requests for my events (as organizer)
router.get("/my-events-requests", auth, async (req, res) => {
  try {
    console.log("Fetching event requests for organizer:", req.user.id);
    
    // Find all events organized by this user that have any join requests
    const events = await Event.find({
      organizer: req.user.id,
      joinRequests: { $exists: true, $ne: [] }
    })
      .populate("joinRequests.user", "username avatar email");

    console.log("Found events with join requests:", events.length);

    const pendingRequests = [];
    events.forEach(event => {
      console.log(`Event "${event.title}" has ${event.joinRequests.length} join requests`);
      event.joinRequests.forEach(request => {
        console.log(`  Request from ${request.user?.username || 'unknown'} - status: ${request.status}`);
        if (request.status === "pending") {
          pendingRequests.push({
            requestId: request._id,
            event: {
              _id: event._id,
              title: event.title,
              startDate: event.startDate,
              pricing: event.pricing,
            },
            user: request.user,
            transactionCode: request.transactionCode,
            requestedAt: request.requestedAt,
          });
        }
      });
    });

    console.log("Returning pending requests:", pendingRequests.length);
    res.json(pendingRequests);
  } catch (err) {
    console.error("Get events requests error:", err);
    res.status(500).json({ error: "Failed to fetch event requests" });
  }
});

// POST leave event
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const index = event.participants.indexOf(req.user.id);
    if (index === -1) {
      return res.status(400).json({ error: "Not a participant" });
    }

    event.participants.splice(index, 1);
    event.capacity.current -= 1;

    // Move someone from waitlist if available
    if (event.waitlist.length > 0) {
      const nextUser = event.waitlist.shift();
      event.participants.push(nextUser);
      event.capacity.current += 1;
    }

    await event.save();
    await event.populate("participants", "username avatar");

    res.json(event);
  } catch (err) {
    console.error("Leave event error:", err);
    res.status(500).json({ error: "Failed to leave event" });
  }
});

export default router;
