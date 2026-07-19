# NearSkill — Complete Product Plan

---

## 1. Product Requirements Document (PRD)

### 1.1 Product Summary
NearSkill is a mobile app that connects people who need a skill right now with skilled people who are physically nearby and have voluntarily made themselves available. The core interaction is proximity + intent + consent: a user walks into a café needing a photographer, and if a photographer nearby has turned on "Available Mode," the app can surface them for a connection request.

### 1.2 Problem Statement
Finding a trustworthy skilled person (photographer, tutor, mechanic, makeup artist, musician, translator, etc.) in the moment is hard. Existing marketplaces are built around browsing and scheduling in advance, not "who's near me right now."

### 1.3 Goals
- Let people discover available, skilled individuals nearby, with consent on both sides.
- Make availability strictly opt-in and time-boxed, so no one is ever passively tracked.
- Keep the core loop simple: discover → request → accept → chat → meet → rate.
- Ship a safe, privacy-respecting MVP that can scale into a marketplace later.

### 1.4 Non-Goals (for MVP)
- No in-app payments/escrow (future version).
- No public browsing of all users' profiles/skills without proximity context.
- No background/always-on location tracking.
- No group requests or teams (future version).

### 1.5 Target Users
- **Seekers**: people who need a skill on short notice (event attendee, traveler, small business owner, student).
- **Providers**: freelancers/skilled individuals who want short-notice local work or connections (photographers, tutors, designers, technicians, artists, fitness trainers, etc.).
- Most users will be both, depending on context.

### 1.6 Success Metrics (early stage)
- % of "Available Mode" sessions that result in at least one request.
- Request → acceptance rate.
- Acceptance → completed interaction rate.
- Average rating and repeat usage rate.
- Time from app open to first relevant nearby result.

### 1.7 Key Constraints
- Location must always be approximate (fuzzed), never exact GPS coordinates shown to another user.
- A user is invisible by default; only visible while Available Mode is active and only within its set duration.
- All discovery and messaging must respect block/report state instantly.

---

## 2. User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Guest** | Not logged in | Can view onboarding/marketing screens only |
| **Registered User (Seeker)** | Default role for any signed-up user | Search nearby, view public profiles, send requests, chat after acceptance, rate, report/block |
| **Registered User (Provider)** | Any user who has added skills + enabled Available Mode | Everything a Seeker can do, plus: appear in nearby discovery, receive requests, accept/reject, set pricing |
| **Admin/Moderator** (internal, not public-facing app) | NearSkill staff | Review reports, suspend/ban accounts, view aggregated (not raw personal) analytics, manage skill categories |

> Note: "Seeker" and "Provider" are not separate accounts — they are behavior modes of a single `User` model. Anyone can switch on Available Mode to become discoverable as a Provider for their listed skills.

---

## 3. User Flow

### 3.1 Onboarding & Setup
1. Sign up (email/phone + password, or OAuth) → verify → login (JWT issued).
2. Create profile: name, photo, bio, skills (with proficiency/tags), interests, portfolio images, pricing (optional/per-skill), location permission prompt (approximate only).
3. Set privacy defaults (who can see profile details, visibility radius, etc.).

### 3.2 Becoming Discoverable (Provider side)
1. User opens app → toggles **Available Mode**.
2. Selects duration (e.g., 30 min / 1 hr / 2 hr / custom) and which skill(s) they're available for right now.
3. App shares an **approximate** location (rounded/fuzzed) while mode is active.
4. Timer counts down; mode auto-disables at expiry (or user disables manually anytime).
5. User becomes visible only to nearby Seekers searching for a matching skill.

### 3.3 Discovery & Request (Seeker side)
1. User opens "Nearby" tab → sees a fuzzed map + list of currently available people, filterable by skill/category/rating/price.
2. User taps a provider card → sees public profile (bio, portfolio, rating, price range) — exact location still hidden.
3. User sends a **connection/service request** with an optional short message and desired skill.
4. Provider gets a push notification with request details.

### 3.4 Accept / Reject
1. Provider reviews the request (who, what skill, message, seeker's rating).
2. Provider accepts or rejects (optionally with a reason).
3. On accept → a chat channel opens; both users get a notification.
4. On reject → seeker is notified; no chat is created; no contact info shared.

### 3.5 Real-Time Chat & Meetup
1. Users chat in real time (Socket.io) to agree on exact meeting point, price, timing.
2. Either party can still block/report from within the chat at any time.
3. Precise location is only ever exchanged voluntarily inside chat (as a shared text/pin), never automatically.

### 3.6 Rating & Review
1. After the interaction, both users are prompted to rate each other (stars + optional text).
2. Ratings feed into public profile aggregate score.

### 3.7 Safety Actions (always available)
- Block user → immediately hides them from each other everywhere (discovery, chat, requests).
- Report user → sends report to moderation queue with reason + optional evidence (chat excerpt reference, not raw exposure of private data to other users).

---

## 4. Feature List — MVP vs Future

### 4.1 MVP (v1.0)
1. Registration/login (email + password, JWT)
2. Profile creation & edit (photo, bio, skills, portfolio images, pricing, bio links)
3. Available Mode with selectable duration + skill selection
4. Nearby discovery (approximate location, skill-based)
5. Skill-based search & filters (category, price range, rating)
6. Send / receive connection requests
7. Accept / reject requests
8. Real-time 1:1 chat (post-acceptance only)
9. Push notifications (new request, accepted/rejected, new message, mode expiring soon)
10. Basic privacy controls (who can see full profile, visibility radius setting)
11. Block & report
12. Rating & review after interaction
13. Approximate-location-only guarantee (server-side enforced fuzzing)
14. Visibility strictly gated behind Available Mode

### 4.2 Future Versions (v1.1+)
- In-app payments / escrow / invoicing
- Verified ID / skill certification badges
- Scheduled availability (not just "right now") and advance bookings
- Group/team requests (e.g., a whole event crew)
- Favorites / saved providers
- In-app video call before meeting
- Multi-language support & auto-translation in chat
- AI-assisted skill-matching / recommendations
- Provider analytics dashboard (views, request conversion)
- Web dashboard for providers
- Loyalty / repeat-client perks
- Dispute resolution workflow
- Geo-fenced event mode (e.g., conferences, festivals with many providers active)

---

## 5. Database Schema (PostgreSQL via Prisma)

```prisma
model User {
  id                String     @id @default(uuid())
  email             String     @unique
  phone             String?    @unique
  passwordHash      String
  name              String
  photoUrl          String?
  bio               String?
  ratingAvg         Float      @default(0)
  ratingCount       Int        @default(0)
  isVerified        Boolean    @default(false)
  isBanned          Boolean    @default(false)
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  skills            UserSkill[]
  portfolioImages   PortfolioImage[]
  availability      AvailabilitySession[]
  sentRequests      ConnectionRequest[] @relation("SentRequests")
  receivedRequests  ConnectionRequest[] @relation("ReceivedRequests")
  messagesSent      Message[]
  ratingsGiven      Rating[] @relation("RatingsGiven")
  ratingsReceived   Rating[] @relation("RatingsReceived")
  blocksInitiated   Block[]  @relation("BlocksInitiated")
  blocksReceived    Block[]  @relation("BlocksReceived")
  reportsFiled      Report[] @relation("ReportsFiled")
  reportsReceived   Report[] @relation("ReportsReceived")
  privacySettings   PrivacySetting?
  devices           Device[]
}

model Skill {
  id          String       @id @default(uuid())
  name        String       @unique
  category    String
  userSkills  UserSkill[]
}

model UserSkill {
  id          String   @id @default(uuid())
  userId      String
  skillId     String
  priceMin    Int?
  priceMax    Int?
  experience  String?   // e.g. "3 years", free text or enum
  user        User      @relation(fields: [userId], references: [id])
  skill       Skill     @relation(fields: [skillId], references: [id])

  @@unique([userId, skillId])
}

model PortfolioImage {
  id        String   @id @default(uuid())
  userId    String
  imageUrl  String
  caption   String?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model AvailabilitySession {
  id            String   @id @default(uuid())
  userId        String
  skillIds      String[] // skills user is available for right now
  startTime     DateTime @default(now())
  endTime       DateTime
  isActive      Boolean  @default(true)
  approxLat     Float    // pre-fuzzed on write, never exact
  approxLng     Float
  visibilityRadiusM Int  @default(2000)
  user          User     @relation(fields: [userId], references: [id])

  @@index([isActive, endTime])
}

model ConnectionRequest {
  id            String   @id @default(uuid())
  fromUserId    String
  toUserId      String
  skillId       String
  message       String?
  status        RequestStatus @default(PENDING)
  createdAt     DateTime @default(now())
  respondedAt   DateTime?

  fromUser      User     @relation("SentRequests", fields: [fromUserId], references: [id])
  toUser        User     @relation("ReceivedRequests", fields: [toUserId], references: [id])
  chat          Chat?
}

enum RequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
  CANCELLED
}

model Chat {
  id            String   @id @default(uuid())
  requestId     String   @unique
  createdAt     DateTime @default(now())
  isActive      Boolean  @default(true)

  request       ConnectionRequest @relation(fields: [requestId], references: [id])
  messages      Message[]
}

model Message {
  id        String   @id @default(uuid())
  chatId    String
  senderId  String
  content   String
  sentAt    DateTime @default(now())
  readAt    DateTime?

  chat      Chat     @relation(fields: [chatId], references: [id])
  sender    User     @relation(fields: [senderId], references: [id])
}

model Rating {
  id          String   @id @default(uuid())
  fromUserId  String
  toUserId    String
  requestId   String
  stars       Int      // 1-5
  comment     String?
  createdAt   DateTime @default(now())

  fromUser    User     @relation("RatingsGiven", fields: [fromUserId], references: [id])
  toUser      User     @relation("RatingsReceived", fields: [toUserId], references: [id])

  @@unique([fromUserId, requestId])
}

model Block {
  id            String   @id @default(uuid())
  blockerId     String
  blockedId     String
  createdAt     DateTime @default(now())

  blocker       User     @relation("BlocksInitiated", fields: [blockerId], references: [id])
  blocked       User     @relation("BlocksReceived", fields: [blockedId], references: [id])

  @@unique([blockerId, blockedId])
}

model Report {
  id            String   @id @default(uuid())
  reporterId    String
  reportedId    String
  reason        String
  details       String?
  status        ReportStatus @default(OPEN)
  createdAt     DateTime @default(now())

  reporter      User     @relation("ReportsFiled", fields: [reporterId], references: [id])
  reported      User     @relation("ReportsReceived", fields: [reportedId], references: [id])
}

enum ReportStatus {
  OPEN
  REVIEWING
  RESOLVED
  DISMISSED
}

model PrivacySetting {
  id                  String  @id @default(uuid())
  userId              String  @unique
  showExactDistance   Boolean @default(false) // if false, shows "nearby" bucket not meters
  defaultRadiusM      Int     @default(2000)
  showPricing         Boolean @default(true)
  showPortfolio       Boolean @default(true)

  user                User    @relation(fields: [userId], references: [id])
}

model Device {
  id        String   @id @default(uuid())
  userId    String
  fcmToken  String
  platform  String   // ios | android
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}
```

**Key schema decisions**
- `AvailabilitySession.approxLat/approxLng` are written already-fuzzed (rounded to ~100–300m grid) — the exact raw GPS reading is never persisted.
- A `ConnectionRequest` becomes a `Chat` only on acceptance — no chat table row exists before that.
- `Block` is directional and checked in every discovery/request/chat query.

---

## 6. API Endpoint List

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/verify-otp` (if phone verification used)

### Profile
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/photo`
- `POST /api/users/me/portfolio` (upload image)
- `DELETE /api/users/me/portfolio/:imageId`
- `GET /api/users/:id` (public view, respects privacy settings & block state)

### Skills
- `GET /api/skills` (catalog/categories, for search filters)
- `POST /api/users/me/skills`
- `PATCH /api/users/me/skills/:skillId`
- `DELETE /api/users/me/skills/:skillId`

### Availability
- `POST /api/availability/start` `{ skillIds, durationMinutes }`
- `POST /api/availability/stop`
- `GET /api/availability/me` (current status/time remaining)

### Discovery
- `GET /api/nearby?skill=&radius=&minRating=&priceMax=` → returns fuzzed distance buckets + provider cards
- `GET /api/nearby/:providerId` (public profile detail, still no exact location)

### Connection Requests
- `POST /api/requests` `{ toUserId, skillId, message }`
- `GET /api/requests/incoming`
- `GET /api/requests/outgoing`
- `PATCH /api/requests/:id/accept`
- `PATCH /api/requests/:id/reject`
- `PATCH /api/requests/:id/cancel`

### Chat
- `GET /api/chats/:chatId/messages` (paginated history)
- `POST /api/chats/:chatId/messages` (fallback REST send; primary is Socket.io event)
- Socket.io events: `chat:join`, `chat:message`, `chat:typing`, `chat:read`

### Ratings
- `POST /api/ratings` `{ requestId, toUserId, stars, comment }`
- `GET /api/users/:id/ratings`

### Safety
- `POST /api/blocks` `{ blockedId }`
- `DELETE /api/blocks/:blockedId`
- `POST /api/reports` `{ reportedId, reason, details }`

### Privacy
- `GET /api/privacy/me`
- `PATCH /api/privacy/me`

### Notifications
- `POST /api/devices` (register FCM token)
- `DELETE /api/devices/:id`

### Admin (internal/moderation only, separate auth scope)
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`
- `PATCH /api/admin/users/:id/ban`

---

## 7. Folder Structure

### 7.1 Frontend — React Native + Expo
```
nearskill-app/
├── app.json
├── App.tsx
├── src/
│   ├── api/                 # axios/fetch clients per resource
│   │   ├── authApi.ts
│   │   ├── userApi.ts
│   │   ├── nearbyApi.ts
│   │   ├── requestApi.ts
│   │   ├── chatApi.ts
│   │   └── ratingApi.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthStack.tsx
│   │   └── MainTabs.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── EditProfileScreen.tsx
│   │   ├── availability/
│   │   │   └── AvailableModeScreen.tsx
│   │   ├── discovery/
│   │   │   ├── NearbyMapScreen.tsx
│   │   │   └── NearbyListScreen.tsx
│   │   ├── requests/
│   │   │   ├── IncomingRequestsScreen.tsx
│   │   │   └── OutgoingRequestsScreen.tsx
│   │   ├── chat/
│   │   │   ├── ChatListScreen.tsx
│   │   │   └── ChatRoomScreen.tsx
│   │   ├── ratings/
│   │   │   └── RateUserScreen.tsx
│   │   └── settings/
│   │       ├── PrivacySettingsScreen.tsx
│   │       └── BlockReportScreen.tsx
│   ├── components/           # shared/reusable UI
│   │   ├── ProviderCard.tsx
│   │   ├── SkillTag.tsx
│   │   ├── RatingStars.tsx
│   │   └── AvailabilityTimer.tsx
│   ├── context/               # auth/session/socket providers
│   │   ├── AuthContext.tsx
│   │   └── SocketContext.tsx
│   ├── hooks/
│   │   ├── useLocation.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── locationFuzzing.ts  # client-side helper only; server re-enforces
│   │   └── validators.ts
│   └── constants/
│       └── config.ts
├── assets/
└── package.json
```

### 7.2 Backend — Node.js + Express
```
nearskill-server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── firebase.ts
│   ├── middleware/
│   │   ├── auth.ts             # JWT verification
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.routes.ts
│   │   ├── skills/
│   │   ├── availability/
│   │   │   ├── availability.controller.ts
│   │   │   ├── availability.service.ts   # includes location fuzzing logic
│   │   │   └── availability.routes.ts
│   │   ├── discovery/
│   │   │   ├── discovery.controller.ts
│   │   │   └── discovery.service.ts      # geo queries, skill filters
│   │   ├── requests/
│   │   ├── chat/
│   │   │   ├── chat.gateway.ts           # Socket.io handlers
│   │   │   └── chat.service.ts
│   │   ├── ratings/
│   │   ├── safety/                        # blocks + reports
│   │   ├── privacy/
│   │   └── notifications/
│   │       ├── fcm.service.ts
│   │       └── device.routes.ts
│   ├── jobs/
│   │   └── expireAvailability.ts          # cron to auto-disable expired sessions
│   ├── lib/
│   │   ├── prismaClient.ts
│   │   ├── cloudinary.ts
│   │   └── socket.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

---

## 8. Security and Privacy Plan

### 8.1 Authentication & Authorization
- JWT access tokens (short-lived, ~15 min) + refresh tokens (longer-lived, stored securely, rotated on use).
- Passwords hashed with bcrypt/argon2, never stored/logged in plaintext.
- All write endpoints require valid JWT; ownership checks on every resource (a user can only edit their own profile/skills/availability).

### 8.2 Location Privacy (core to this product)
- Raw device GPS never leaves the client in exact form for discovery purposes — it is rounded to a coarse grid (e.g., ~100–300m) on the client, and the server independently re-validates/re-fuzzes before storage, so a compromised client can't force exact coordinates through.
- Discovery API returns **distance buckets** ("~200m away," "~1km away") rather than coordinates or precise distances, unless the user has explicitly agreed to share more inside an active chat.
- No location history is retained beyond the active `AvailabilitySession` — sessions and their location data are deleted or anonymized after expiry (configurable retention window, e.g., 24–72h for analytics, then purged).
- Available Mode is strictly opt-in per session; there is no default "always visible" state, and the toggle is never silently re-enabled by the app.

### 8.3 Data Protection
- All traffic over HTTPS/TLS; Socket.io over WSS.
- Images uploaded via Cloudinary using signed, short-lived upload URLs — the server never handles raw files directly.
- PII (email, phone) never exposed in public profile responses — only fields explicitly marked public are returned.
- Rate limiting on auth, request-sending, and reporting endpoints to reduce abuse/spam.

### 8.4 Block & Report Enforcement
- Block state is checked at the database-query level in discovery, request creation, and chat access — not just hidden in the UI.
- Reports go into a moderation queue; repeated/severe reports can auto-restrict an account pending review.
- Chat content tied to a request/report can be reviewed by moderators only when a report is filed, not by default.

### 8.5 Privacy Controls (user-facing)
- Per-user toggle: show/hide pricing, show/hide portfolio, control default visibility radius.
- Users can end Available Mode instantly at any time.
- Users can delete their account, which cascades: profile, portfolio, availability history, and chat participation are removed/anonymized (messages from a deleted user can show as "Deleted User" without exposing the account).

### 8.6 Compliance Considerations
- Design with GDPR/CCPA-style principles in mind: minimal data collection, explicit consent for location, right to delete/export data.
- Maintain an audit log for admin actions (bans, report resolutions) separate from user-facing data.

---

## 9. Development Phases (recommended order)

### Phase 0 — Setup & Foundations (Week 1)
- Repo setup (frontend + backend), CI basics, environment configs.
- PostgreSQL + Prisma schema migration (core tables only: User, Skill, UserSkill).
- Basic Express server with health check, JWT auth scaffolding.
- Expo app scaffold with navigation shell (Auth stack + Main tabs placeholders).

### Phase 1 — Auth & Profile (Weeks 2–3)
- Registration/login/refresh/logout.
- Profile CRUD (name, bio, photo, skills, portfolio via Cloudinary).
- Privacy settings model + basic screens.

### Phase 2 — Availability & Discovery (Weeks 4–5)
- Available Mode start/stop with duration + skill selection.
- Location fuzzing logic (client + server).
- Nearby discovery API with skill/rating/price filters.
- Map + list UI (Google Maps or Mapbox) showing fuzzed positions/distance buckets.

### Phase 3 — Requests & Chat (Weeks 6–7)
- Connection request create/accept/reject/cancel.
- Push notifications for request events (FCM).
- Socket.io real-time chat, message history, read receipts.

### Phase 4 — Safety & Trust (Week 8)
- Block & report flows, enforced at query level.
- Ratings & reviews after completed interaction.
- Cron job to auto-expire Available Mode sessions.

### Phase 5 — Hardening & Polish (Weeks 9–10)
- Rate limiting, input validation, error handling pass.
- Empty states, loading states, offline handling in the app.
- Security review of location fuzzing and privacy enforcement.
- Basic analytics (non-PII) for success metrics.

### Phase 6 — Beta & Launch Prep (Weeks 11–12)
- Closed beta with a small user group (test the "walk into a café" scenario end-to-end).
- Bug fixing, performance tuning (query indexing on `AvailabilitySession`, `ConnectionRequest`).
- App store / Play store submission prep (privacy disclosures, screenshots, policy pages).

> This plan assumes one full-stack developer or a very small team, working on Windows with Expo (no Mac needed for iOS development in Expo-managed workflow until you need native builds, at which point EAS Build handles iOS compilation in the cloud).

---

*End of document.*
