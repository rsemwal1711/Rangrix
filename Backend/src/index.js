import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadScores, sanitizeEntry, saveEntryToDb, getUserRank } from "./leaderboard.js";
import { createAuthRouter } from "./auth.js";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

app.get("/api/leaderboard", async (req, res) => {
  try {
    const scores = await loadScores();
    res.json(scores);
  } catch (err) {
    console.error("Failed to load leaderboard", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

app.get("/api/leaderboard/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.sub;
    const rank = await getUserRank(userId);
    if (rank == null) {
      return res.json({ rank: null });
    }
    return res.json({ rank });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// mount auth routes
createAuthRouter().then((router) => {
  app.use("/api/auth", router);
}).catch((err) => {
  console.error('Failed to initialize auth routes', err);
});

app.post("/api/leaderboard", async (req, res) => {
  const entry = sanitizeEntry(req.body);
  if (!entry) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  // If Authorization Bearer token provided, attempt to decode and set username
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded) {
        if (decoded.username) entry.name = decoded.username;
        if (decoded.sub) entry.userId = decoded.sub;
      }
    } catch (err) {
      // ignore invalid token and proceed with provided name
    }
  }

  const dbResponse = await saveEntryToDb(entry);
  if (!dbResponse) {
    return res.status(500).json({ error: "Failed to save leaderboard entry" });
  }

  return res.json(dbResponse);
});

app.listen(port, () => {
  console.log(`Rangrix backend listening on http://localhost:${port}`);
});
