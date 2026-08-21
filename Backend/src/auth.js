import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getUserCollection } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_EXPIRES_IN = "30d";

export async function createAuthRouter() {
  const express = await import("express");
  const router = express.Router();

  router.post("/signup", async (req, res) => {
    const { username, password, email } = req.body || {};
    if (!username || !password || !email) {
      return res.status(400).json({ error: "Missing username, email or password" });
    }

    const users = await getUserCollection();
    if (!users) {
      return res.status(500).json({ error: "Database is not configured" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "User with that email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date();

    let result;
    try {
      result = await users.insertOne({
        username: String(username).trim(),
        email: normalizedEmail,
        passwordHash,
        createdAt,
        updatedAt: createdAt,
      });
    } catch (err) {
      // Handle duplicate email race condition (unique index violation)
      if (err && err.code === 11000) {
        return res.status(409).json({ error: "User with that email already exists" });
      }
      console.error("Failed to create user:", err);
      return res.status(500).json({ error: "Failed to create user" });
    }

    const userId = result.insertedId.toString();
    const token = jwt.sign({ sub: userId, username: String(username).trim(), email: normalizedEmail }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

    res.json({ token, username: String(username).trim(), email: normalizedEmail });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing login credentials" });
    }

    const users = await getUserCollection();
    if (!users) {
      return res.status(500).json({ error: "Database is not configured" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await users.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || "");
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: user._id.toString(), username: user.username, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ token, username: user.username, email: user.email });
  });

  router.get("/me", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ username: decoded.username, email: decoded.email });
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  });

  router.patch("/profile", async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { username, email, password } = req.body || {};
    if (!username && !email && !password) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const users = await getUserCollection();
    if (!users) {
      return res.status(500).json({ error: "Database is not configured" });
    }

    const update = { updatedAt: new Date() };

    if (username) {
      update.username = String(username).trim();
    }

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await users.findOne({
        email: normalizedEmail,
        _id: { $ne: new ObjectId(decoded.sub) },
      });
      if (existing) {
        return res.status(409).json({ error: "User with that email already exists" });
      }
      update.email = normalizedEmail;
    }

    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    let result;
    try {
      result = await users.findOneAndUpdate(
        { _id: new ObjectId(decoded.sub) },
        { $set: update },
        { returnDocument: "after" }
      );
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ error: "User with that email already exists" });
      }
      console.error("Failed to update profile:", err);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    const user = result?.value || result;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Re-issue token since it embeds username/email
    const newToken = jwt.sign(
      { sub: user._id.toString(), username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    res.json({ token: newToken, username: user.username, email: user.email });
  });

  return router;
}