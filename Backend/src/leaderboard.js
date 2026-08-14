import { getLeaderboardCollection } from "./db.js";

const DEFAULT_SCORES = [
  { rank: 1, name: "KANE", score: 1420, detail: "Neon Sprint" },
  { rank: 2, name: "NOVA", score: 1180, detail: "Hard Run" },
  { rank: 3, name: "RYZE", score: 1050, detail: "Medium Lane" },
];

function timeAgo(date) {
  if (!date) return "Leaderboard Run";

  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now - past) / 1000);

  const intervals = [
    { label: "year", secs: 31536000 },
    { label: "month", secs: 2592000 },
    { label: "day", secs: 86400 },
    { label: "hr", secs: 3600 },
    { label: "min", secs: 60 },
    { label: "sec", secs: 1 },
  ];

  if (seconds < 5) return "just now";

  for (const { label, secs } of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count}${label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

// Turns raw db docs into ranked leaderboard entries with a relative-time detail label
function normalizeScores(topScores) {
  return topScores.map((item, index) => ({
    rank: index + 1,
    name: item.name,
    score: item.score,
    detail: timeAgo(item.updatedAt || item.createdAt),
  }));
}

export async function loadScores() {
  const scores = await loadScoresFromDb();
  return Array.isArray(scores) && scores.length > 0 ? scores : DEFAULT_SCORES;
}

export function sanitizeEntry(body) {
  if (!body || typeof body.score !== "number") return null;

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 12) || "PLAYER" : null;
  const userId = typeof body.userId === "string" ? body.userId : null;
  if (!name && !userId) return null;

  const score = Math.max(0, Math.floor(body.score));
  return { name: name || "PLAYER", score, userId };
}

export async function saveEntryToDb(entry) {
  const collection = await getLeaderboardCollection();
  if (!collection) {
    return null;
  }

  if (entry.userId) {
    const result = await collection.findOneAndUpdate(
      { userId: entry.userId },
      {
        $set: { name: entry.name, updatedAt: new Date() },
        $max: { score: entry.score },
        $setOnInsert: { createdAt: new Date(), userId: entry.userId },
      },
      { upsert: true, returnDocument: "after" }
    );

    const topScores = await collection
      .find()
      .sort({ score: -1, createdAt: 1 })
      .limit(10)
      .toArray();

    const rank = await collection.countDocuments({ score: { $gt: result.value.score } }) + 1;

    return { rank, topScores: normalizeScores(topScores) };
  }

  const existing = await collection.findOne({ name: entry.name });
  if (existing) {
    const updated = await collection.findOneAndUpdate(
      { _id: existing._id },
      { $max: { score: entry.score }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const topScores = await collection
      .find()
      .sort({ score: -1, createdAt: 1 })
      .limit(10)
      .toArray();

    const rank = await collection.countDocuments({ score: { $gt: updated.value.score } }) + 1;

    return { rank, topScores: normalizeScores(topScores) };
  }

  await collection.insertOne({ name: entry.name, score: entry.score, createdAt: new Date() });

  const topScores = await collection
    .find()
    .sort({ score: -1, createdAt: 1 })
    .limit(10)
    .toArray();

  const rank = await collection.countDocuments({ score: { $gt: entry.score } }) + 1;

  return { rank, topScores: normalizeScores(topScores) };
}

export async function loadScoresFromDb() {
  const collection = await getLeaderboardCollection();
  if (!collection) {
    return null;
  }

  const topScores = await collection
    .find()
    .sort({ score: -1, createdAt: 1 })
    .limit(10)
    .toArray();

  return normalizeScores(topScores);
}

export async function getUserRank(userId) {
  if (!userId) return null;
  const collection = await getLeaderboardCollection();
  if (!collection) return null;

  const userDoc = await collection.findOne({ userId: String(userId) });
  if (!userDoc) return null;

  const rank = (await collection.countDocuments({ score: { $gt: userDoc.score } })) + 1;
  return rank;
}