# 🌐 NEXUS — Social Media Platform

> **Where connections converge.** A full-stack, production-ready social media platform built with React, Node.js, MongoDB, and Socket.io.

---

## 📁 PROJECT STRUCTURE

```
nexus/
├── backend/                         # Node.js + Express API
│   ├── config/
│   │   ├── database.js              # MongoDB Atlas connection
│   │   ├── cloudinary.js            # File upload config + multer
│   │   └── socket.js                # Socket.io server + event map
│   ├── controllers/
│   │   ├── authController.js        # Register, login, refresh, logout
│   │   ├── postController.js        # CRUD, feed, trending, likes, bookmarks
│   │   ├── userController.js        # Profile, avatar, cover, suggestions
│   │   ├── followController.js      # Follow / unfollow toggle
│   │   ├── commentController.js     # Add, delete, like comments
│   │   ├── messageController.js     # Conversations, send, delete messages
│   │   ├── notificationController.js# Get, mark-read, delete notifications
│   │   ├── searchController.js      # Search users/posts/hashtags, trending
│   │   └── adminController.js       # Analytics, ban users, remove posts
│   ├── middleware/
│   │   ├── auth.js                  # JWT protect + role restrict + optional
│   │   ├── errorHandler.js          # Global error handler
│   │   └── validators.js            # express-validator rule sets
│   ├── models/
│   │   ├── User.js                  # User schema (auth + profile + social)
│   │   ├── Post.js                  # Post schema (text/media, hashtags, likes)
│   │   ├── Comment.js               # Nested comments with likes
│   │   ├── Message.js               # Conversation + Message schemas
│   │   ├── Notification.js          # Notification schema (TTL 30d)
│   │   └── Hashtag.js               # Hashtag tracking for trending
│   ├── routes/
│   │   ├── auth.js                  # /api/auth/*
│   │   ├── users.js                 # /api/users/*
│   │   ├── posts.js                 # /api/posts/*
│   │   ├── comments.js              # /api/comments/*
│   │   ├── follows.js               # /api/follows/*
│   │   ├── messages.js              # /api/messages/*
│   │   ├── notifications.js         # /api/notifications/*
│   │   ├── search.js                # /api/search/*
│   │   └── admin.js                 # /api/admin/*
│   ├── utils/
│   │   └── seeder.js                # Sample data seeder
│   ├── .env.example                 # Environment variable template
│   ├── package.json
│   └── server.js                    # Express app + Socket.io bootstrap
│
└── frontend/                        # React + Vite SPA
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── AuthLayout.jsx   # Split-screen auth wrapper
    │   │   ├── feed/
    │   │   │   ├── PostCard.jsx     # Full post with actions
    │   │   │   ├── CreatePostModal.jsx # Compose modal
    │   │   │   ├── CreatePostBar.jsx   # Quick compose bar
    │   │   │   ├── CommentSection.jsx  # Inline comments
    │   │   │   ├── PostMenu.jsx        # Context menu (delete/report)
    │   │   │   ├── PostSkeleton.jsx    # Loading placeholder
    │   │   │   ├── SuggestedUsers.jsx  # Right sidebar widget
    │   │   │   └── TrendingHashtags.jsx # Right sidebar widget
    │   │   ├── profile/
    │   │   │   └── EditProfileModal.jsx # Edit profile + avatar/cover upload
    │   │   ├── explore/
    │   │   │   ├── UserCard.jsx     # Search result user item
    │   │   │   └── HashtagCard.jsx  # Trending hashtag card
    │   │   └── shared/
    │   │       ├── AppLayout.jsx    # Main app shell
    │   │       ├── Sidebar.jsx      # Desktop sidebar nav
    │   │       ├── MobileNav.jsx    # Mobile bottom tab bar
    │   │       ├── Avatar.jsx       # Avatar with color fallback
    │   │       └── RealTimeHandler.jsx # Socket event listener
    │   ├── hooks/
    │   │   └── useDebounce.js       # Debounce for search
    │   ├── pages/
    │   │   ├── LoginPage.jsx        # Sign in form
    │   │   ├── RegisterPage.jsx     # Sign up form
    │   │   ├── FeedPage.jsx         # Infinite scroll home feed
    │   │   ├── ProfilePage.jsx      # User profile + posts
    │   │   ├── ExplorePage.jsx      # Search + trending
    │   │   ├── MessagesPage.jsx     # Real-time chat UI
    │   │   ├── NotificationsPage.jsx # Notification center
    │   │   ├── BookmarksPage.jsx    # Saved posts
    │   │   ├── SettingsPage.jsx     # Theme, password, account
    │   │   ├── AdminPage.jsx        # Admin dashboard
    │   │   └── NotFoundPage.jsx     # 404
    │   ├── services/
    │   │   ├── api.js               # Axios instance + auto token refresh
    │   │   ├── index.js             # All API service modules
    │   │   └── socket.js            # Socket.io client singleton
    │   ├── store/
    │   │   ├── authStore.js         # Zustand auth (persisted)
    │   │   └── uiStore.js           # Zustand UI (theme, modals, badges)
    │   ├── styles/
    │   │   └── index.css            # Tailwind + design tokens + dark mode
    │   ├── App.jsx                  # Router + route guards
    │   └── main.jsx                 # Entry: React + QueryClient
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 QUICK START

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

### 1. Clone & Install

```bash
# Clone the project
git clone <your-repo-url>
cd nexus

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Random 32+ char string |
| `JWT_REFRESH_SECRET` | Random 32+ char string (different from above) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `CLIENT_URL` | Frontend URL (default: http://localhost:5173) |

### 3. Seed Sample Data

```bash
cd backend
node utils/seeder.js
```

This creates 6 sample users with posts, comments, and follow relationships.

**Demo login credentials:**
- Admin: `admin@nexus.social` / `Admin123!`
- User: `alex@nexus.social` / `Test123!`

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/api/health

---

## 📡 API REFERENCE

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (email or username) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidates refresh token) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password with token |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:username` | Get profile by username |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/avatar` | Upload avatar (multipart) |
| POST | `/api/users/cover` | Upload cover image (multipart) |
| GET | `/api/users/suggestions` | Get follow suggestions |
| GET | `/api/users/:id/followers` | Paginated followers |
| GET | `/api/users/:id/following` | Paginated following |
| PUT | `/api/users/change-password` | Change password |
| DELETE | `/api/users/account` | Delete account (soft) |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/feed` | Paginated following feed |
| GET | `/api/posts/trending` | Trending posts (48h) |
| GET | `/api/posts/bookmarks` | Current user's bookmarks |
| GET | `/api/posts/user/:userId` | User's posts |
| POST | `/api/posts` | Create post (multipart) |
| GET | `/api/posts/:id` | Get single post |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post (soft) |
| POST | `/api/posts/:id/like` | Toggle like |
| POST | `/api/posts/:id/repost` | Repost |
| POST | `/api/posts/:id/bookmark` | Toggle bookmark |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/comments/:postId` | Add comment |
| GET | `/api/comments/:postId` | Get comments |
| DELETE | `/api/comments/:id` | Delete comment |
| POST | `/api/comments/:id/like` | Toggle like on comment |

### Follow

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follows/:userId` | Toggle follow/unfollow |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | All conversations |
| GET | `/api/messages/:conversationId` | Messages in conversation |
| POST | `/api/messages/send` | Send message |
| DELETE | `/api/messages/:id` | Delete message (for me) |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| DELETE | `/api/notifications/:id` | Delete notification |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=&type=` | Search (type: all/users/posts/hashtags) |
| GET | `/api/search/trending-hashtags` | Top hashtags (24h) |
| GET | `/api/search/hashtag/:tag` | Posts by hashtag |

### Admin (requires admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/analytics` | Stats + charts |
| GET | `/api/admin/users` | User list with filters |
| PUT | `/api/admin/users/:id/ban` | Ban user |
| PUT | `/api/admin/users/:id/unban` | Unban user |
| PUT | `/api/admin/users/:id/role` | Change role |
| GET | `/api/admin/posts` | All posts |
| DELETE | `/api/admin/posts/:id` | Remove post |

### Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `message:send` | Client → Server | `{ recipientId, content }` |
| `message:receive` | Server → Client | `{ message, conversationId }` |
| `message:typing` | Client → Server | `{ recipientId, isTyping }` |
| `notification:new` | Server → Client | Notification object |
| `user:online` | Server → Client | `{ userId }` |
| `user:offline` | Server → Client | `{ userId }` |

---

## 🏗️ MONGODB SCHEMA OVERVIEW

### User
- Identity: `username`, `displayName`, `email`, `password` (bcrypt)
- Profile: `avatar`, `coverImage`, `bio`, `website`, `location`
- Social: `followers[]`, `following[]`, `followersCount`, `followingCount`
- Auth: `refreshToken`, `passwordResetToken`, `passwordResetExpires`
- Status: `role`, `isActive`, `isBanned`, `isPrivate`

### Post
- `author` (ref: User), `content` (2200 chars max)
- `media[]` — url, publicId, type (image/video)
- `likes[]`, `likesCount`, `commentsCount`, `sharesCount`
- `hashtags[]`, `mentions[]`, `visibility`
- `isRepost`, `originalPost` (ref: Post)
- `isDraft`, `isDeleted`, `isModerated`

### Comment
- `post` (ref: Post), `author` (ref: User), `content`
- `likes[]`, `likesCount`
- `parentComment` (ref: Comment) — for nested replies

### Conversation + Message
- Conversation: `participants[]`, `lastMessage`, `unreadCounts` (Map)
- Message: `sender`, `recipient`, `content`, `isRead`, `messageType`

### Notification
- `recipient`, `sender`, `type` (like/comment/follow/mention/repost)
- `post`, `comment` refs, `text`, `isRead`
- Auto-expires after 30 days (TTL index)

### Hashtag
- `tag`, `postsCount`, `recentPosts`, `lastUsed`
- Indexed for trending queries

---

## 🔒 SECURITY FEATURES

| Feature | Implementation |
|---------|----------------|
| Password hashing | bcrypt with 12 salt rounds |
| JWT auth | Access token (15min) + Refresh token (7d) |
| Refresh rotation | New refresh token issued on each refresh |
| Rate limiting | 100 req/15min globally, 10 req/15min for auth |
| Helmet | Secure HTTP headers |
| MongoDB sanitize | NoSQL injection prevention |
| Input validation | express-validator on all mutation endpoints |
| Role-based access | Admin routes protected by `restrictTo('admin')` |
| Soft deletes | Posts/users soft-deleted, not permanently removed |

---

## 🌍 DEPLOYMENT GUIDE

### Backend → Render.com

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Set **Root Directory** to `backend`
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add all environment variables from `.env.example`
7. Deploy

### Frontend → Vercel

1. Import your repository in Vercel
2. Set **Root Directory** to `frontend`
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `dist`
5. Add environment variable: `VITE_API_URL=https://your-render-url.onrender.com`
6. Deploy

### MongoDB Atlas Setup

1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist all IPs (`0.0.0.0/0`) for Render compatibility
4. Copy the connection string into your `MONGODB_URI` env var

### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud name, API Key, API Secret
3. Create folders: `nexus/avatars`, `nexus/covers`, `nexus/posts`

---

## 🔮 FUTURE FEATURES ROADMAP

### Phase 2 — Content
- **Reels / Short Videos** — vertical video feed with infinite scroll, auto-play
- **Stories** — 24-hour disappearing photo/video stories
- **Live Streaming** — WebRTC-based live broadcasting with chat

### Phase 3 — AI Integration
- **AI Feed Ranking** — ML-based post ranking using engagement signals
- **AI Chatbot Assistant** — In-app GPT-powered assistant for content ideas
- **Content Moderation AI** — Automatic detection of harmful content
- **Smart Hashtag Suggestions** — Auto-suggest hashtags while composing
- **Sentiment Analysis** — Display mood analytics on profile

### Phase 4 — Monetization
- **Creator Fund** — Revenue sharing based on engagement
- **Subscriptions** — Monthly subscriptions to exclusive content
- **Tipping System** — Direct payments to creators via Stripe
- **Ads Platform** — Targeted advertising system with analytics
- **Sponsored Posts** — Brand partnership program

### Phase 5 — Scale
- **Redis Cache** — Cache feed, sessions, and trending data
- **Elasticsearch** — Advanced full-text search
- **CDN Integration** — Edge delivery for media
- **Microservices** — Split into notification, media, and feed services
- **GraphQL API** — Flexible data fetching layer

---

## 🛠️ DEVELOPMENT NOTES

### Adding a New Feature (example: Polls)

1. **Model**: Add `poll` schema to `models/Post.js` or create `models/Poll.js`
2. **Controller**: Add methods to `controllers/postController.js`
3. **Route**: Add endpoint to `routes/posts.js`
4. **Frontend Service**: Add to `frontend/src/services/index.js`
5. **Component**: Create `frontend/src/components/feed/PollCard.jsx`
6. **Integration**: Import in `PostCard.jsx`

### Code Style Guidelines
- Controllers: One function per endpoint, try/catch pattern
- Models: Indexes on all frequently queried fields
- Frontend: React Query for server state, Zustand for client state
- Components: CSS variables for all colors (dark mode compatible)
- API: Always return `{ success: boolean, data/message }`

---

## 📄 LICENSE

MIT — Free to use, modify, and distribute.

---

*Built with ❤️ — Nexus Social Media Platform*
#   S o c i a l M e d i a _ T e a m A G I  
 