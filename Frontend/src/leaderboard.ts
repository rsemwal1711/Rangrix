export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  detail: string;
}

export interface LeaderboardResponse {
  rank: number;
  topScores: LeaderboardEntry[];
}

export async function fetchLeaderboard() {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
  if (!response.ok) throw new Error("Failed to fetch leaderboard");
  return (await response.json()) as LeaderboardEntry[];
}

export async function submitScore(name: string, score: number, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, score }),
  });
  if (!response.ok) throw new Error("Failed to submit score");
  return (await response.json()) as LeaderboardResponse;
}
