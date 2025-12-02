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

// POST join event
router.post("/:id/join", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already joined
    if (event.participants.includes(req.user.id)) {
      return res.status(400).json({ error: "Already joined this event" });
    }

    // Check capacity
    if (event.capacity.current >= event.capacity.max) {
      // Add to waitlist
      if (!event.waitlist.includes(req.user.id)) {
        event.waitlist.push(req.user.id);
        await event.save();
        return res.json({ message: "Added to waitlist", event });
      }
      return res.status(400).json({ error: "Event is full and waitlist full" });
    }

    event.participants.push(req.user.id);
    event.capacity.current += 1;
    await event.save();

    await event.populate("participants", "username avatar");

    res.json(event);
  } catch (err) {
    console.error("Join event error:", err);
    res.status(500).json({ error: "Failed to join event" });
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
