// backend/src/routes/events.js
import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET all events with filtering (public for discovery)
router.get("/", async (req, res) => {
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
      .populate("joinRequests.user", "username avatar email")
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

// GET single event (public for discovery)
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "username email avatar")
      .populate("participants", "username avatar")
      .populate("waitlist", "username avatar")
      .populate("joinRequests.user", "username avatar email");

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

// POST join event - SIMPLIFIED AND REBUILT
router.post("/:id/join", auth, async (req, res) => {
  try {
    const { transactionCode, transactionDetails } = req.body;
    const userId = req.user.id;
    const eventId = req.params.id;

    console.log("=== JOIN EVENT REQUEST ===");
    console.log("Event ID:", eventId);
    console.log("User ID:", userId);
    console.log("Transaction Code:", transactionCode);
    console.log("Request Body:", req.body);

    // Find event
    const event = await Event.findById(eventId).populate("organizer", "username email avatar");
    
    if (!event) {
      console.log("❌ Event not found");
      return res.status(404).json({ error: "Event not found" });
    }

    console.log("Event found:", event.title);
    console.log("Pricing:", event.pricing);
    console.log("Requires Approval:", event.requiresApproval);
    console.log("Current participants:", event.participants.length);
    console.log("Max capacity:", event.capacity?.max);

    // Check if already a participant
    const isAlreadyParticipant = event.participants.some(
      p => p.toString() === userId
    );
    
    if (isAlreadyParticipant) {
      console.log("❌ User already joined");
      return res.status(400).json({ error: "You have already joined this event" });
    }

    // Check capacity
    const maxCapacity = event.capacity?.max || 1000;
    if (event.participants.length >= maxCapacity) {
      console.log("❌ Event full");
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // Check if paid event requires transaction code
    const isPaid = event.pricing && event.pricing.type === "paid";
    if (isPaid && !transactionCode) {
      console.log("❌ Missing transaction code for paid event");
      return res.status(400).json({ 
        error: "Transaction code is required for paid events",
        amount: event.pricing.amount,
        currency: event.pricing.currency 
      });
    }

    // Initialize joinRequests if needed
    if (!Array.isArray(event.joinRequests)) {
      event.joinRequests = [];
    }

    // Check for existing pending request (only if approval required)
    if (event.requiresApproval) {
      const hasPendingRequest = event.joinRequests.some(
        req => req.user.toString() === userId && req.status === "pending"
      );
      
      if (hasPendingRequest) {
        console.log("❌ Already has pending request");
        return res.status(400).json({ error: "You already have a pending join request" });
      }
    }

    // DECISION: Approve immediately or create request?
    const needsApproval = event.requiresApproval === true;

    if (needsApproval) {
      // CREATE JOIN REQUEST
      console.log("Creating join request...");
      event.joinRequests.push({
        user: userId,
        transactionCode: transactionCode || "FREE",
        requestedAt: new Date(),
        status: "pending",
      });
      
      await event.save();
      await event.populate("joinRequests.user", "username avatar");
      
      console.log("✅ Join request created");
      
      // Emit socket notification
      const io = req.app.get("io");
      if (io) {
        io.emit("join_request_created", {
          eventId: event._id,
          eventTitle: event.title,
          organizerId: event.organizer._id.toString(),
          requesterId: userId,
        });
      }

      return res.json({
        success: true,
        message: "Join request submitted! Awaiting organizer approval.",
        event,
        requiresApproval: true
      });
      
    } else {
      // JOIN IMMEDIATELY
      console.log("Adding to participants immediately...");
      event.participants.push(userId);
      
      if (event.capacity) {
        event.capacity.current = event.participants.length;
      }
      
      await event.save();
      await event.populate("participants", "username avatar");
      
      console.log("✅ User added to participants");

      // Emit socket notification
      const io = req.app.get("io");
      if (io) {
        io.emit("participant_joined", {
          eventId: event._id,
          eventTitle: event.title,
          organizerId: event.organizer._id.toString(),
          participantId: userId,
        });
      }

      return res.json({
        success: true,
        message: "Successfully joined event!",
        event,
        requiresApproval: false
      });
    }

  } catch (err) {
    console.error("❌ JOIN EVENT ERROR:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({ 
      error: "Failed to join event",
      details: err.message 
    });
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
    
    // Find events where user has a join request
    const events = await Event.find({
      "joinRequests.user": req.user.id,
    })
      .populate("organizer", "username avatar")
      .populate("joinRequests.user", "username avatar")
      .lean();

    console.log("Found events with requests:", events.length);

    // Map to simpler structure
    const myRequests = events
      .map(event => {
        if (!event.joinRequests || !Array.isArray(event.joinRequests)) {
          return null;
        }
        
        const request = event.joinRequests.find(
          r => r.user && r.user._id && r.user._id.toString() === req.user.id
        );
        
        if (!request) return null;
        
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
      })
      .filter(Boolean); // Remove null entries

    console.log("Returning requests:", myRequests.length);
    res.json(myRequests);
  } catch (err) {
    console.error("Get my join requests error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch join requests",
      message: err.message 
    });
  }
});

// GET pending join requests for my events (as organizer)
router.get("/my-events-requests", auth, async (req, res) => {
  try {
    console.log("=== FETCHING EVENT REQUESTS ===");
    console.log("Organizer ID:", req.user.id);
    
    // Find all events organized by this user
    const events = await Event.find({
      organizer: req.user.id,
      "joinRequests.0": { $exists: true } // Has at least one join request
    })
      .populate("joinRequests.user", "username avatar email")
      .lean();

    console.log("Events with join requests:", events.length);

    // Extract pending requests
    const pendingRequests = [];
    
    events.forEach(event => {
      if (!event.joinRequests || !Array.isArray(event.joinRequests)) {
        return;
      }
      
      console.log(`Event "${event.title}" has ${event.joinRequests.length} join requests`);
      
      event.joinRequests.forEach(request => {
        if (!request.user) {
          console.log(`  Skipping request with no user`);
          return;
        }
        
        console.log(`  Request from ${request.user.username || 'unknown'} - status: ${request.status}`);
        
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
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: "Failed to fetch event requests",
      message: err.message 
    });
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
