````markdown
# CONNECTOR 🚀

> A location-aware social networking platform for discovering people, building meaningful connections, communicating in real time, and sharing content.

CONNECTOR is a full-stack social networking platform that brings together **location-based discovery, skill-based networking, friendships, real-time messaging, and social content sharing** in one application.

The project consists of a modern web application, an Expo/React Native mobile application, a Node.js/Express backend, a PostgreSQL database, Socket.IO for real-time communication, and Cloudinary for image storage.

---

## ✨ Features

### 🔐 Authentication & Security

- User registration
- User login
- JWT-based authentication
- Protected routes and APIs
- Password hashing with bcrypt
- Request validation
- Security headers with Helmet
- CORS protection
- API rate limiting

### 👤 User Profiles

- User profiles
- Name and email
- Bio
- Profile image support
- Location information
- Skill-based user information

### 📍 Location-Based Discovery

- Share user location
- Update latitude and longitude
- Discover nearby users
- Configurable search radius
- Location-aware networking

### 🤝 Connection & Friend System

- Send friend requests
- Accept friend requests
- Reject friend requests
- View pending requests
- View sent requests
- View friends
- Remove friends
- Connection status management

### 💬 Real-Time Messaging

- One-to-one conversations
- Real-time messaging with Socket.IO
- Conversation list
- Message history
- Online user status
- Typing indicator
- Message timestamps
- Delivered status
- Seen/read status
- Unread message count
- Built-in emoji picker
- Real-time message updates

### 📰 Social Feed

- Create text posts
- Create image posts
- Add captions
- View latest posts
- View user-specific posts
- Edit own posts
- Delete own posts
- Image upload through Cloudinary

### 🖼️ Image Upload

- Cloudinary integration
- Multer-based upload handling
- Post image storage
- Secure image URL management

### 💭 Comments

- Add comments to posts
- View comments
- Delete own comments
- Comment support for social posts

> CONNECTOR intentionally does not include a traditional post "Like" system.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │      CONNECTOR      │
                         │   Social Platform   │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
        ┌───────────────────┐               ┌───────────────────┐
        │    Web Client     │               │   Mobile Client   │
        │   React + Vite    │               │ Expo / React Native│
        └─────────┬─────────┘               └─────────┬─────────┘
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js Backend   │
                         │ Express REST API    │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
     ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
     │  PostgreSQL  │       │   Socket.IO  │       │  Cloudinary  │
     │   Database   │       │ Real-time    │       │    Images    │
     │              │       │ Communication│       │              │
     └──────────────┘       └──────────────┘       └──────────────┘
````

---

# 🛠️ Technology Stack

## Frontend — Web

* React
* Vite
* React Router
* Axios
* Tailwind CSS
* React Hot Toast
* Socket.IO Client

## Mobile

* Expo
* React Native
* React Navigation
* Axios
* Socket.IO Client

## Backend

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL
* JWT
* bcrypt
* Socket.IO
* Zod
* Helmet
* CORS
* Express Rate Limit

## Cloud & Storage

* Cloudinary
* Multer

## Development Tools

* Git
* GitHub
* VS Code
* Nodemon
* Postman
* Prisma CLI

---

# 📂 Project Structure

```text
CONNECTOR/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   ├── package.json
│   └── ...
│
├── web/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── frontend/
│   └── Expo / React Native application
│
└── README.md
```

### Directory Roles

| Directory   | Purpose                                                               |
| ----------- | --------------------------------------------------------------------- |
| `backend/`  | Node.js + Express API, Prisma, authentication, database and Socket.IO |
| `web/`      | React + Vite web application                                          |
| `frontend/` | Expo / React Native mobile application                                |
| `README.md` | Project documentation                                                 |

---

# 🔄 Application Flow

```text
User
 │
 ├── Register / Login
 │
 ▼
JWT Authentication
 │
 ▼
CONNECTOR Application
 │
 ├── Profile
 │
 ├── Nearby Users
 │
 ├── Friend Requests
 │
 ├── Friends
 │
 ├── Real-Time Chat
 │
 └── Social Feed
       │
       ├── Text Posts
       ├── Image Posts
       └── Comments
```

---

# 🔐 Authentication Flow

CONNECTOR uses JWT-based authentication.

```text
┌───────────────┐
│     User      │
└───────┬───────┘
        │
        ▼
┌───────────────────┐
│ Login / Register  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Backend validates │
│ user credentials  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     JWT Token     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Protected Request │
│ Authorization:    │
│ Bearer <token>    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Authenticated API │
└───────────────────┘
```

---

# 💬 Real-Time Communication

CONNECTOR uses **Socket.IO** for real-time communication.

The system is designed to support:

```text
User A
   │
   │ Send Message
   ▼
Socket.IO Server
   │
   │ Real-Time Event
   ▼
User B
```

Real-time functionality includes:

* Message receiving
* Typing indicators
* Online status
* Delivered status
* Seen/read status
* Real-time UI updates
* Unread message updates

---

# ☁️ Image Upload Architecture

Post images are uploaded through the backend and stored using Cloudinary.

```text
┌──────────────┐
│ Web / Mobile │
│    Client    │
└──────┬───────┘
       │
       │ Image
       ▼
┌──────────────┐
│ Upload API   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Multer    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Cloudinary  │
└──────┬───────┘
       │
       │ Image URL
       ▼
┌──────────────┐
│  PostgreSQL  │
│    / Prisma  │
└──────────────┘
```

---

# 🗄️ Database

CONNECTOR uses:

* PostgreSQL
* Prisma ORM
* Prisma Migrations

The current application includes database entities for major parts of the platform, including:

```text
User
Skill
UserSkill
Connection
Message
Post
Comment
```

Database schema changes are managed through Prisma migrations.

### Generate Prisma Client

```bash
npx prisma generate
```

### Apply database migrations

```bash
npx prisma migrate dev
```

### Check migration status

```bash
npx prisma migrate status
```

---

# 🌐 API Overview

> The API may evolve as development continues. The following represents the current major API areas.

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

## Location

```http
PUT /api/location/update
GET /api/location/nearby
```

## Connections

```http
POST   /api/connections/request
PUT    /api/connections/request/:id/accept
PUT    /api/connections/request/:id/reject
GET    /api/connections/pending
GET    /api/connections/sent
GET    /api/connections/friends
DELETE /api/connections/friends/:id
```

## Messaging

```http
POST /api/messages
GET  /api/messages/conversations
GET  /api/messages/:userId
```

## Posts

```http
POST   /api/posts
GET    /api/posts/feed
GET    /api/posts/user/:userId
PUT    /api/posts/:postId
DELETE /api/posts/:postId
```

## Image Upload

```http
POST /api/uploads/post-image
```

## Comments

```http
POST   /api/comments
GET    /api/comments/:postId
DELETE /api/comments/:commentId
```

---

# ⚙️ Environment Variables

Create a `.env` file inside the `backend/` directory.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/connector_db"

JWT_SECRET="your_jwt_secret"

PORT=5000

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### ⚠️ Security Notice

Never commit real credentials to GitHub.

Do not expose:

```text
DATABASE_URL
JWT_SECRET
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Use `.gitignore`:

```gitignore
node_modules/
.env
.env.*
!.env.example
dist/
```

---

# 🚀 Installation & Setup

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git
* GitHub account
* Cloudinary account

---

## 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Navigate into the project:

```bash
cd CONNECTOR
```

---

# 🔧 Backend Setup

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

Add the required environment variables.

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

API base URL:

```text
http://localhost:5000/api
```

---

# 🌐 Web Application Setup

Open another terminal:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The web application will be available at:

```text
http://localhost:5173
```

---

# 📱 Mobile Application Setup

The project also contains an Expo / React Native application inside:

```text
frontend/
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

The application can then be tested using:

* Android Emulator
* iOS Simulator
* Physical mobile device

> Mobile configuration may require additional environment/API configuration depending on the development device.

---

# 🧪 Development Workflow

A typical development workflow looks like:

```text
1. Start PostgreSQL
        │
        ▼
2. Start Backend
        │
        ▼
3. Start Web / Mobile Client
        │
        ▼
4. Test API
        │
        ▼
5. Test UI
        │
        ▼
6. Test Real-Time Features
        │
        ▼
7. Commit Changes
        │
        ▼
8. Push to GitHub
```

---

# 🧰 Useful Commands

## Backend

```bash
npm install
npm run dev
npm start
```

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma migrate status
```

## Web

```bash
npm install
npm run dev
npm run build
```

## Mobile

```bash
npm install
npx expo start
```

---

# 🔒 Security Practices

CONNECTOR follows several security practices:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Environment-based secrets
* Helmet security headers
* CORS configuration
* Rate limiting
* Input validation
* Prisma ORM
* Controlled database access

---

# 📊 Current Project Status

| Module                  | Status        |
| ----------------------- | ------------- |
| Backend API             | ✅ Working     |
| PostgreSQL + Prisma     | ✅ Working     |
| Authentication          | ✅ Implemented |
| User Profiles           | ✅ Implemented |
| Location Sharing        | ✅ Implemented |
| Nearby User Discovery   | ✅ Implemented |
| Friend Requests         | ✅ Implemented |
| Friend Management       | ✅ Implemented |
| Real-Time Chat          | ✅ Implemented |
| Online Status           | ✅ Implemented |
| Typing Indicator        | ✅ Implemented |
| Message Timestamps      | ✅ Implemented |
| Delivered / Seen Status | ✅ Implemented |
| Emoji Picker            | ✅ Implemented |
| Social Feed             | ✅ Implemented |
| Text Posts              | ✅ Implemented |
| Image Posts             | ✅ Implemented |
| Cloudinary Upload       | ✅ Implemented |
| Post Edit / Delete      | ✅ Implemented |
| Comments                | ✅ Implemented |
| Mobile Synchronization  | 🔄 Ongoing    |
| UI/UX Refinement        | 🔄 Ongoing    |
| Production Deployment   | 🔮 Future     |

---

# 🗺️ Roadmap

## Phase 1 — Foundation

* Project architecture
* Backend setup
* PostgreSQL database
* Prisma integration
* Authentication

## Phase 2 — User & Location System

* Profiles
* Location sharing
* Nearby users
* Skills

## Phase 3 — Connection System

* Friend requests
* Friend management
* Connection status

## Phase 4 — Real-Time Chat

* Conversations
* Real-time messaging
* Online status
* Typing indicators
* Delivered/seen status
* Unread messages

## Phase 5 — Chat Improvements

* Message timestamps
* Emoji picker
* Additional messaging improvements

## Phase 6 — Social Feed

* Text posts
* Image posts
* Cloudinary integration
* Feed
* Edit/delete posts
* Comments

## Phase 7 — Mobile Synchronization

* Mobile authentication
* Mobile profiles
* Mobile connections
* Mobile feed
* Mobile image posts
* Mobile comments
* Mobile chat
* Cross-platform testing

## Future

* Push notifications
* Advanced notification system
* Improved search
* Media sharing
* Profile customization
* Performance optimization
* Production deployment
* Additional social networking features

---

# 🎯 Project Vision

CONNECTOR is designed around a simple idea:

```text
             DISCOVER
                │
                ▼
             CONNECT
                │
                ▼
           COMMUNICATE
                │
                ▼
              SHARE
                │
                ▼
           COLLABORATE
```

The goal is to create a platform where users can discover people around them, connect through common interests and skills, communicate in real time, and share experiences through a social feed.

---

# 🌟 Why CONNECTOR?

Traditional social platforms primarily focus on content consumption and existing social circles.

CONNECTOR focuses on combining:

```text
┌──────────────────────────────┐
│     Location Discovery       │
├──────────────────────────────┤
│     Skill-Based Networking   │
├──────────────────────────────┤
│     Friend Connections       │
├──────────────────────────────┤
│     Real-Time Communication  │
├──────────────────────────────┤
│     Social Content           │
└──────────────────────────────┘
```

This creates a unified environment for discovering, connecting, communicating, and collaborating.

---

# 🧑‍💻 Development Philosophy

The project is being developed with emphasis on:

* Clean architecture
* Reusable components
* Secure authentication
* RESTful API design
* Real-time communication
* Relational database design
* Modular services
* Cross-platform compatibility
* Maintainable code
* Scalable architecture

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

A typical contribution workflow:

```text
Fork
  ↓
Create Feature Branch
  ↓
Make Changes
  ↓
Test
  ↓
Commit
  ↓
Push
  ↓
Create Pull Request
```

Example:

```bash
git checkout -b feature/new-feature
```

```bash
git add .
```

```bash
git commit -m "feat: add new feature"
```

```bash
git push origin feature/new-feature
```

---

# 🐛 Issues & Feedback

If you find a bug or have an improvement idea:

1. Open an issue on GitHub.
2. Clearly describe the problem or suggestion.
3. Include relevant screenshots, logs, or reproduction steps when possible.

---

# 📄 License

This project is currently being developed for educational and project purposes.

License information can be updated when the project is prepared for public release.

---

# ⭐ CONNECTOR

### Connect. Communicate. Collaborate.

Built with ❤️ using modern web, backend, database, real-time, and mobile technologies.

```
```
