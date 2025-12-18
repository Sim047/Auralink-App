// backend/src/routes/events.js
import express from "express";
import Event from "../models/Event.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET /api/events - list events (simple)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ status: "published" })
      .populate("organizer", "username avatar")
      .sort({ startDate: 1 })
      .limit(50);
    res.json({ events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events/my/created - events organized by current user
router.get("/my/created", auth, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ startDate: -1 })
      .populate("organizer", "username avatar")
      .populate("participants", "username avatar email")
      .populate("joinRequests.user", "username avatar email");
    res.json({ events });
  } catch (err) {
    console.error("Get my created events error:", err);
    res.status(500).json({ error: "Failed to fetch created events" });
  }
});

// GET /api/events/my/joined - events where current user is a participant
router.get("/my/joined", auth, async (req, res) => {
  try {
    const events = await Event.find({ participants: req.user.id })
      .sort({ startDate: -1 })
      .populate("organizer", "username avatar")
      .populate("participants", "username avatar email")
      .populate("joinRequests.user", "username avatar email");
    res.json({ events });
  } catch (err) {
    console.error("Get my joined events error:", err);
    res.status(500).json({ error: "Failed to fetch joined events" });
  }
});

// GET /api/events/my/pending - events where current user has a pending join request
router.get("/my/pending", auth, async (req, res) => {
  try {
    const events = await Event.find({
      "joinRequests.user": req.user.id,
      "joinRequests.status": "pending",
    })
      .sort({ startDate: -1 })
      .populate("organizer", "username avatar")
      .populate("participants", "username avatar email")
      .populate("joinRequests.user", "username avatar email");
    res.json({ events });
  } catch (err) {
    console.error("Get my pending events error:", err);
    res.status(500).json({ error: "Failed to fetch pending events" });
  }
});

// GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "username avatar")
      .populate("participants", "username avatar");
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error("Get event error:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// POST /api/events - create
router.post("/", auth, async (req, res) => {
  try {
    const data = { ...req.body, organizer: req.user.id };
    const event = await Event.create(data);
    await event.populate("organizer", "username avatar");
    res.status(201).json(event);
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// POST /api/events/:id/join
router.post("/:id/join", auth, async (req, res) => {
  try {
    const { transactionCode, transactionDetails } = req.body || {};
    const userId = req.user.id;
    const event = await Event.findById(req.params.id).populate("organizer", "username avatar");
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Simple duplicate check
    if (event.participants.some(p => String(p) === String(userId))) {
      return res.status(400).json({ error: "You have already joined this event" });
    }

    // Capacity
    const max = Number(event.capacity?.max || 1000);
    if ((event.participants?.length || 0) >= max) return res.status(400).json({ error: "Event is full" });

    const isPaid = event.pricing && event.pricing.type === "paid" && Number(event.pricing.amount) > 0;
    if (isPaid && !transactionCode) {
      return res.status(400).json({ error: "Transaction code required for paid events", amount: event.pricing.amount, currency: event.pricing.currency });
    }

    if (event.requiresApproval) {
      event.joinRequests = event.joinRequests || [];
      console.log("Creating join request for event", event._id, "user", userId);
      event.joinRequests.push({ user: userId, transactionCode: transactionCode || "", transactionDetails: transactionDetails || "", requestedAt: new Date(), status: "pending" });
      try {
        await event.save();
      } catch (saveErr) {
        console.error("Failed saving join request for event", event._id, "err:", saveErr);
        return res.status(500).json({ error: "Failed to save join request", details: saveErr.message });
      }

      const io = req.app.get("io");
      if (io) io.emit("join_request_created", { eventId: event._id, organizerId: String(event.organizer._id), requesterId: userId });

      return res.json({ success: true, message: "Join request submitted", requiresApproval: true });
    }

    // Immediate join
    event.participants = event.participants || [];
    console.log("Adding participant", userId, "to event", event._id, "currentParticipants", event.participants.length);
    event.participants.push(userId);
    if (event.capacity) event.capacity.current = event.participants.length;
    try {
      await event.save();
    } catch (saveErr) {
      console.error("Failed saving event when adding participant", event._id, "err:", saveErr);
      return res.status(500).json({ error: "Failed to join event", details: saveErr.message });
    }

    const io = req.app.get("io");
    if (io) io.emit("participant_joined", { eventId: event._id, participantId: userId });

    return res.json({ success: true, message: "Successfully joined event", requiresApproval: false });
  } catch (err) {
    console.error("Join event error:", err);
    res.status(500).json({ error: "Failed to join event", details: err.message });
  }
});

// POST approve request (organizer)
router.post("/:id/approve-request/:requestId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (String(event.organizer) !== String(req.user.id)) return res.status(403).json({ error: "Not authorized" });

    const reqObj = event.joinRequests.id(req.params.requestId);
    if (!reqObj) return res.status(404).json({ error: "Request not found" });
    if (reqObj.status !== "pending") return res.status(400).json({ error: "Request already processed" });
    // Capacity guard
    const currentCount = (event.participants || []).length;
    const max = Number(event.capacity?.max || 1000);
    if (currentCount >= max) {
      // mark request rejected due to full capacity and notify
      reqObj.status = "rejected";
      reqObj.rejectionReason = "Event full";
      await event.save();
      const ioFull = req.app.get("io");
      if (ioFull) ioFull.emit("join_request_rejected", { eventId: event._id, userId: String(reqObj.user), reason: "Event is full" });
      return res.status(400).json({ error: "Event is at full capacity" });
    }

    // Prevent double adding
    if ((event.participants || []).some(p => String(p) === String(reqObj.user))) {
      reqObj.status = "approved";
      await event.save();
      return res.json({ success: true, message: "Request approved (user already a participant)" });
    }

    // Approve and add participant
    event.participants = event.participants || [];
    event.participants.push(reqObj.user);
    reqObj.status = "approved";
    if (event.capacity) event.capacity.current = event.participants.length;
    await event.save();

    // Populate for richer emit
    await event.populate("participants", "username avatar email");
    await event.populate("joinRequests.user", "username avatar email");

    const io = req.app.get("io");
    if (io) {
      io.emit("join_request_approved", { eventId: event._id, userId: String(reqObj.user) });
      io.emit("participant_joined", { eventId: event._id, participantId: String(reqObj.user) });
    }

    res.json({ success: true, message: "Request approved", event });
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// POST reject request (organizer)
router.post("/:id/reject-request/:requestId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (String(event.organizer) !== String(req.user.id)) return res.status(403).json({ error: "Not authorized" });

    const reqObj = event.joinRequests.id(req.params.requestId);
    if (!reqObj) return res.status(404).json({ error: "Request not found" });
    if (reqObj.status !== "pending") return res.status(400).json({ error: "Request already processed" });
    const { reason } = req.body || {};
    reqObj.status = "rejected";
    if (reason) reqObj.rejectionReason = String(reason).slice(0, 500);
    await event.save();

    const io = req.app.get("io");
    if (io) io.emit("join_request_rejected", { eventId: event._id, userId: String(reqObj.user), reason: reqObj.rejectionReason || null });

    res.json({ success: true, message: "Request rejected", requestId: reqObj._id });
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
