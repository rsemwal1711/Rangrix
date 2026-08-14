import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url) });

const mongoUrl = process.env.MONGO_URL?.trim() ?? "";
const mongoDbName = process.env.MONGO_DB_NAME?.trim() || "rangrix";
const leaderboardCollectionName = process.env.MONGO_COLLECTION?.trim() || "leaderboard";
const userCollectionName = process.env.MONGO_USER_COLLECTION?.trim() || "users";

let client;
let db;
const collections = new Map();

export async function getDb() {
  if (!mongoUrl) {
    return null;
  }

  if (db) {
    return db;
  }

  client = new MongoClient(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  db = client.db(mongoDbName);
  return db;
}

export async function getDbCollection(name) {
  if (!mongoUrl) {
    return null;
  }

  if (collections.has(name)) {
    return collections.get(name);
  }

  const database = await getDb();
  if (!database) {
    return null;
  }

  const collection = database.collection(name);

  if (name === leaderboardCollectionName) {
    await collection.createIndex({ score: -1 });
    await collection.createIndex({ userId: 1 }, { unique: true, sparse: true });
  }

  if (name === userCollectionName) {
    await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ username: 1 });
  }

  collections.set(name, collection);
  return collection;
}

export async function getLeaderboardCollection() {
  return getDbCollection(leaderboardCollectionName);
}

export async function getUserCollection() {
  return getDbCollection(userCollectionName);
}

export async function closeDb() {
  if (!client) {
    return;
  }

  await client.close();
  client = null;
  db = null;
  collections.clear();
}
