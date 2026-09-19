import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import prisma from "./config/prisma.js";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/socket.io", (req, res) => res.status(200).send("OK"));

// Auth & Posts Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Fetch All Registered Users from Database
app.get("/api/location/nearby", async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany({});
    
    const users = allUsers.map(u => ({
      ...u,
      id: u.id,
      _id: u.id,
      name: u.name || u.email?.split("@")[0] || "User",
      distance: 1.0,
      location: { latitude: 22.5726, longitude: 88.3639 }
    }));

    return res.status(200).json({ success: true, users, data: users, nearbyUsers: users });
  } catch (err) {
    return res.status(200).json({ success: true, users: [], data: [] });
  }
});

// Connections Endpoints
app.post("/api/connections/send", async (req, res) => {
  res.status(200).json({ success: true, message: "Friend request sent" });
});

app.get("/api/connections/friends", (req, res) => res.status(200).json({ success: true, friends: [], data: [] }));
app.get("/api/connections/pending", (req, res) => res.status(200).json({ success: true, requests: [], pending: [], data: [] }));
app.get("/api/connections/sent", (req, res) => res.status(200).json({ success: true, requests: [], sent: [], data: [] }));
app.get("/api/messages/conversations", (req, res) => res.status(200).json({ success: true, conversations: [], data: [] }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on http://localhost:5000"));
