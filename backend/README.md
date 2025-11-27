BANJA Backend — Complete Robust Scaffold
---------------------------------------

Quick start:

1. Copy .env example:
   cp .env.example .env
   Edit .env (MONGO_URI, JWT_SECRET)

2. Install:
   npm install

3. Run in dev:
   npm run dev

Endpoints:
- POST  /api/auth/register   { username, email, password }
- POST  /api/auth/login      { email, password }
- POST  /api/users/avatar    (auth, form-data file 'avatar') -> returns { success: true, user }
- GET   /api/messages/:room  (auth) -> messages
- POST  /api/files/upload    (form-data file 'file') -> { url: '/uploads/...' }

Notes:
- Uploads stored in uploads/ (make sure Render persistent disk set)
- Serve uploads: /uploads/*
- Socket.IO integrated in server.js (events: join_room, send_message, react, edit_message, delete_message, delivered, read, typing)

Health check:
- The backend exposes a lightweight GET / that returns { ok: true } — useful for Render health checks and uptime probes.
