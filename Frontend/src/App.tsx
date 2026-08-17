import { useRef, useState, useCallback, useEffect } from "react";
import SparkleTrail from "./components/SparkleTrail";
import GameCanvas from "./components/GameCanvas";
import ScoreBoard from "./components/ScoreBoard";
import GameOverModal from "./components/GameOverModal";
import { fetchLeaderboard, submitScore, LeaderboardEntry } from "./leaderboard";
import { Engine, GameState } from "./game/engine";
import { AudioProvider } from "./audio/AudioProvider";
import { AudioToggleButton } from "./audio/AudioToggleButton";
import { SoundClickListener } from "./audio/SoundClickListener";
import { Medal } from "./components/Medal";
import { RankCelebration } from "./components/RankCelebrations";


function denseRank(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  let rank = 0;
  let lastScore: number | null = null;
  return sorted.map((entry) => {
    if (entry.score !== lastScore) {
      rank += 1;
      lastScore = entry.score;
    }
    return { ...entry, rank };
  });
}


export default function App() {
  const engineRef = useRef<Engine | null>(null);
  const [state, setState] = useState<GameState>("idle");
  const [appPhase, setAppPhase] = useState<"intro" | "setup" | "playing">("intro");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [soundEnabled] = useState(true);
  const [soundVolume] = useState(0.6);
  const [playerColor, setPlayerColor] = useState<string>("#ff7849");
  const [playerShape, setPlayerShape] = useState<"circle" | "square" | "triangle">("circle");
  const [engineReady, setEngineReady] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });
  const [authUser, setAuthUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem("username");
    } catch {
      return null;
    }
  });
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const DEMO_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: "KANE", score: 1420, detail: "Neon Sprint" },
    { rank: 2, name: "NOVA", score: 1180, detail: "Hard Run" },
    { rank: 3, name: "RYZE", score: 1050, detail: "Medium Lane" },
  ];

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);
  const [leaderboardLimit, setLeaderboardLimit] = useState<number>(3);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [submittedRank, setSubmittedRank] = useState<number | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // ---- Local (in-memory only) custom audio track ----
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [musicLoop, setMusicLoop] = useState(true);

  const [celebration, setCelebration] = useState<{ rank: 1 | 2 | 3; id: number } | null>(null);
  const celebrationIdRef = useRef(0);

  const handleScoreChange = useCallback((s: number) => setScore(s), []);
  const handleStreakChange = useCallback((s: number) => setStreak(s), []);

  const handleStateChange = useCallback((s: GameState) => {
    setState(s);
    if (s === "gameover" && engineRef.current) {
      const engine = engineRef.current;
      setIsNewHighScore(engine.score >= engine.highScore && engine.score > 0);
      setHighScore(engine.highScore);
      setSubmittedRank(null);
      setSubmissionMessage(null);
      setSubmissionError(null);
    }
  }, []);

  const handleRestart = () => {
    setAppPhase("playing");
    engineRef.current?.start();
  };

  const handleStart = () => {
    setAppPhase("playing");
    const engine = engineRef.current;
    if (engineReady && engine && engine.state !== "playing") {
      engine.setPlayerAppearance(playerColor, playerShape);
      engine.start();
    }
  };

  const handlePlayGame = () => {
    setAppPhase("setup");
  };

  useEffect(() => {
    const engine = engineRef.current;
    if (appPhase === "playing" && engineReady && engine && engine.state !== "playing") {
      engine.start();
    }
  }, [appPhase, engineReady]);

  const handleCustomizeAgain = () => {
    engineRef.current?.stop();
    setState("idle");
    setAppPhase("setup");
  };

  useEffect(() => {
    if (appPhase !== "playing") {
      setEngineReady(false);
    }
  }, [appPhase]);

  const handleSubmitLeaderboard = async (score: number) => {
    setSubmissionError(null);
    setSubmissionMessage(null);
    setIsSubmittingScore(true);

    const safeName = (authUser || "PLAYER").trim().slice(0, 12) || "PLAYER";
    try {
      const response = await submitScore(safeName, score, authToken ?? undefined);

      // Dense-rank the returned scores: equal scores share the same rank (1,1,2,3...)
      const sorted = [...response.topScores].sort((a, b) => b.score - a.score);
      let rank = 0;
      let lastScore: number | null = null;
      const ranked = sorted.map((entry) => {
        if (entry.score !== lastScore) {
          rank += 1;
          lastScore = entry.score;
        }
        return { ...entry, rank };
      });

      setLeaderboard(ranked.slice(0, leaderboardLimit));

      // Find this player's dense rank based on their own submission
      const myEntry = ranked.find((e) => e.score === score && e.name === safeName);
      const myRank = myEntry ? myEntry.rank : response.rank;

      setSubmittedRank(myRank);
      setSubmissionMessage(
        myRank <= 3
          ? `Nice! You made the Top 3 with rank #${myRank}.`
          : `Good run — your rank is #${myRank}.`
      );

      if (myRank <= 3) {
        celebrationIdRef.current += 1;
        setCelebration({ rank: myRank as 1 | 2 | 3, id: celebrationIdRef.current });
      }
    } catch (error) {
      setSubmissionError("Could not submit score. Try again later.");
    } finally {
      setIsSubmittingScore(false);
    }
  };

  useEffect(() => {
    if (state === "gameover" && score > 0 && !isSubmittingScore && submittedRank == null) {
      handleSubmitLeaderboard(score);
    }
  }, [state, score, isSubmittingScore, submittedRank]);

  async function doAuth(endpoint: "login" | "signup") {
    setAuthError(null);
    try {
      const body: any = { password: authPassword };
      if (endpoint === "signup") {
        body.username = authUsername;
        body.email = authEmail;
      } else {
        body.email = authEmail;
      }

      // const res = await fetch(`http://localhost:4000/api/auth/${endpoint}`, {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Auth failed");
      }
      const data = await res.json();
      setAuthToken(data.token);
      setAuthUser(data.username);
      try {
        setLeaderboardLoading(true);
        const scores = await fetchLeaderboard();
        setLeaderboard(denseRank(scores).slice(0, leaderboardLimit));
        try {
          // const meRes = await fetch("http://localhost:4000/api/leaderboard/me", {
          const meRes = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard/me`, {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (meRes.ok) {
            const meJson = await meRes.json();
            setMyRank(meJson.rank ?? null);
          }
        } catch { }
      } catch {
      } finally {
        setLeaderboardLoading(false);
      }
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
      } catch { }
      setAuthUsername("");
      setAuthPassword("");
      setAuthEmail("");
    } catch (err: any) {
      if (err instanceof TypeError) {
        setAuthError("Network error: could not reach auth server");
      } else {
        setAuthError(err.message || "Auth error");
      }
    }
  }

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLeaderboardLoading(true);
      if (!authUser) {
        if (!active) return;
        setLeaderboard(DEMO_LEADERBOARD);
        setLeaderboardLoading(false);
        return;
      }

      try {
        const scores = await fetchLeaderboard();
        if (!active) return;
        setLeaderboard(scores.length ? denseRank(scores).slice(0, leaderboardLimit) : []);
        if (authUser && authToken) {
          try {
            // const meRes = await fetch("http://localhost:4000/api/leaderboard/me", {
            const meRes = await fetch(`${import.  meta.env.VITE_API_URL}/api/leaderboard/me`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            if (meRes.ok) {
              const meJson = await meRes.json();
              setMyRank(meJson.rank ?? null);
            } else {
              setMyRank(null);
            }
          } catch {
            setMyRank(null);
          }
        } else {
          setMyRank(null);
        }
      } catch {
        if (!active) return;
        setLeaderboard([]);
        setMyRank(null);
      } finally {
        if (!active) return;
        setLeaderboardLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [authUser, leaderboardLimit]);


  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.setDifficulty(difficulty);
    e.setSoundEnabled(soundEnabled);
    e.setSoundVolume(soundVolume);
    e.setPlayerAppearance(playerColor, playerShape);
  }, [difficulty, soundEnabled, soundVolume, playerColor, playerShape]);

  const handleAudioFileSelect = (file: File | null) => {
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);

    if (!file) {
      setCustomAudioUrl(null);
      setCustomAudioName(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioName(file.name);
  };

  useEffect(() => {
    return () => {
      if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    };
  }, [customAudioUrl]);

  useEffect(() => {
    const audioEl = audioElRef.current;
    if (!audioEl) return;
    audioEl.volume = musicVolume;
    audioEl.loop = musicLoop;
  }, [musicVolume, musicLoop, customAudioUrl]);

  useEffect(() => {
    const audioEl = audioElRef.current;
    if (!audioEl || !customAudioUrl || !musicEnabled) return;
    if (state === "playing") {
      audioEl.play().catch(() => { });
    }
  }, [state === "playing", customAudioUrl, musicEnabled]);

  useEffect(() => {
    const audioEl = audioElRef.current;
    if (!audioEl) return;
    if (appPhase !== "playing") {
      audioEl.pause();
    }
  }, [appPhase]);

  useEffect(() => {
    if (!musicEnabled) {
      audioElRef.current?.pause();
    } else if (musicEnabled && appPhase === "playing" && customAudioUrl) {
      audioElRef.current?.play().catch(() => { });
    }
  }, [musicEnabled]);

  const isPlaying = appPhase === "playing";

  return (
    <AudioProvider>
      <SoundClickListener />
      {celebration && (
        <RankCelebration
          key={celebration.id}
          rank={celebration.rank}
          onDone={() => setCelebration(null)}
        />
      )}
      <div className="stage relative min-h-screen w-full flex items-center justify-center overflow-y-auto overflow-x-hidden px-4 py-6 alive-bg">
        <div className="absolute top-4 right-4 z-20">
          <AudioToggleButton />
        </div>
        <SparkleTrail />
        <div className="bg-aurora" />
        <div className="bg-grid" />
        <div className="bg-particles" />

        {customAudioUrl && (
          <audio ref={audioElRef} src={customAudioUrl} preload="auto" />
        )}

        <div className={`relative z-10 w-full ${isPlaying ? "max-w-[720px] h-[72vh] max-h-[90vh]" : "max-w-[1200px]"}`}>

          {isPlaying && (
            <div className="frame-inner">
              <GameCanvas
                engineRef={engineRef}
                onScoreChange={handleScoreChange}
                onStateChange={handleStateChange}
                onStreakChange={handleStreakChange}
                onEngineReady={() => {
                  setEngineReady(true);
                  if (engineRef.current) engineRef.current.setPlayerAppearance(playerColor, playerShape);
                }}
              />
            </div>
          )}

          {state === "playing" && <ScoreBoard score={score} highScore={highScore} streak={streak} />}

          {!isPlaying && appPhase === "intro" && (
            <div className="relative w-full flex items-center justify-center px-6 py-6 overflow-hidden">
              <div className="rx-horizon" aria-hidden="true" />

              <div className="w-full max-w-[1200px] animate-fade-in">
                <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] items-start">
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-[26px] bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-[#1c0f24] font-black text-3xl shadow-[0_18px_45px_rgba(255,120,73,0.35)]">
                          R
                        </div>
                        <div>
                          <h2 className="rx-display text-5xl text-white">RANGRIX</h2>
                          <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Neon lane runner</p>
                          {authUser && (
                            <div className="mt-3">
                              <div className="text-3xl font-bold text-white">{authUser}</div>
                              <div className="text-sm text-amber-200/80">{myRank ? `Rank #${myRank}` : 'Unranked'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="rounded-full border border-pink-400/20 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-orange-100">
                        Ready to race
                      </div>
                    </div>

                    <p className="max-w-3xl text-sm leading-7 text-white/75">
                      A sharp arcade runner with a sleek HUD, ambient audio and tight controls. Choose your style, set difficulty, then hit play for a polished start.
                    </p>

                    <div className="mt-6 w-full max-w-[340px]">
                      <div className="space-y-3">
                        {authUser && (
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-white">Signed in as <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">{authUser}</span></div>
                            <button
                              onClick={() => {
                                setAuthToken(null);
                                setAuthUser(null);
                                try { localStorage.removeItem("token"); localStorage.removeItem("username"); } catch { }
                                setLeaderboard(DEMO_LEADERBOARD);
                              }}
                              className="text-sm text-pink-200/80 underline"
                            >Sign out</button>
                          </div>
                        )}

                        {!authUser && (
                          <>
                            {authMode === 'signup' && (
                              <input
                                value={authUsername}
                                onChange={(e) => setAuthUsername(e.target.value)}
                                placeholder="username"
                                className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                              />
                            )}
                            <input
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="email"
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                            />
                            <input
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="password"
                              type="password"
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                            />
                            <div className="grid gap-2 sm:grid-cols-2">
                              <button
                                onClick={() => { setAuthMode('login'); doAuth('login'); }}
                                className="rounded-full bg-white/5 px-3 py-2 text-sm"
                              >Login</button>
                              <button
                                onClick={() => { setAuthMode('signup'); doAuth('signup'); }}
                                className="rounded-full bg-white/10 px-3 py-2 text-sm"
                              >Sign up</button>
                            </div>
                            {authError && <div className="text-sm text-red-300">{authError}</div>}
                          </>
                        )}
                      </div>

                    </div>

                    <button
                      onClick={handlePlayGame}
                      disabled={!authUser}
                      className={`w-full max-w-[340px] rounded-full px-8 py-4 text-lg font-semibold tracking-wide btn-primary shadow-[0_18px_42px_rgba(255,46,109,0.3)] ${authUser ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-[#1c0f24]' : 'bg-white/6 text-white/60 cursor-not-allowed'}`}
                    >
                      {authUser ? 'Launch Game' : 'Sign in to launch'}
                    </button>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-[#1c0f24]/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Controls</p>
                        <div className="mt-4 space-y-2 text-sm text-white/70">
                          <p>Space / ↑ — Jump</p>
                          <p>← → — Move</p>
                        </div>
                      </div>
                      <div className="rounded-3xl bg-[#1c0f24]/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Experience</p>
                        <div className="mt-4 space-y-2 text-sm text-white/70">
                          <p>Shape + color customization</p>
                          <p>Refined ambient soundtrack</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <aside className="rounded-[32px] bg-[#1c0f24]/80 p-5">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.32em] text-amber-200/70">Leaderboard</p>
                        <h3 className="text-xl font-semibold text-white">Top {leaderboardLimit}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={String(leaderboardLimit)}
                          onChange={(e) => setLeaderboardLimit(Number(e.target.value))}
                          className="rounded-full bg-white/5 px-3 py-1 text-sm text-white outline-none"
                        >
                          <option value="3">3</option>
                          <option value="5">5</option>
                          <option value="10">10</option>
                        </select>
                        <span className="rounded-full bg-pink-400/15 px-3 py-1 text-[11px] uppercase tracking-[0.34em] text-pink-100">{authUser ? 'Live' : 'Demo'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {leaderboardLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((idx) => (
                            <div key={idx} className="h-16 rounded-3xl bg-white/5 p-3 animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        leaderboard.map((entry) => (
                          <div
                            key={entry.rank}
                            data-rank={entry.rank}
                            className="rx-lb-row flex items-center justify-between gap-3 rounded-3xl bg-white/5 p-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="rx-lb-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-3xl bg-pink-400/15 text-sm font-semibold text-pink-100">
                                {entry.rank}
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-bold text-white truncate">{entry.name}</p>
                                <p className="text-xs text-amber-100/70 font-medium mt-0.5">{entry.detail}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right">
                                <p className="rx-mono text-sm font-semibold text-white">{entry.score}</p>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">pts</p>
                              </div>
                              {entry.rank <= 3 && <Medal rank={entry.rank as 1 | 2 | 3} size={24} />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <p className="mt-5 text-[11px] uppercase tracking-[0.34em] text-white/30">
                      Leaderboard preview — top scores will populate here after each run.
                    </p>
                  </aside>
                </div>
              </div>
            </div>
          )}

          {!isPlaying && appPhase === "setup" && (
            <div className="relative w-full flex items-center justify-center px-6 py-6 min-h-screen">
              <div className="w-full max-w-lg animate-fade-in">
                <div className="rounded-[32px] bg-[#1c0f24]/90 p-7">
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Choose your style</h3>
                      <p className="mt-2 text-sm text-white/60">Pick a color, shape, difficulty and optional music before you jump into the game.</p>
                    </div>

                    <div className="grid gap-4">
                      <div className="rounded-3xl bg-[#241530]/95 p-4">
                        <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/40">Color</div>
                        <div className="mt-4 flex gap-3">
                          {['#ff7849', '#ffcc4d', '#ff2e6d', '#8b5cf6'].map((c) => (
                            <button
                              key={c}
                              onClick={() => setPlayerColor(c)}
                              style={{ backgroundColor: c }}
                              className={`w-11 h-11 rounded-full border-2 ${playerColor === c ? 'border-white' : 'border-white/15'}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl bg-[#241530]/95 p-4">
                        <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/40">Shape</div>
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => setPlayerShape('circle')}
                            className={`w-12 h-12 rounded-xl border ${playerShape === 'circle' ? 'border-white bg-white text-[#1c0f24]' : 'border-white/15 text-white/70'}`}
                          >○</button>
                          <button
                            onClick={() => setPlayerShape('square')}
                            className={`w-12 h-12 rounded-xl border ${playerShape === 'square' ? 'border-white bg-white text-[#1c0f24]' : 'border-white/15 text-white/70'}`}
                          >▢</button>
                          <button
                            onClick={() => setPlayerShape('triangle')}
                            className={`w-12 h-12 rounded-xl border ${playerShape === 'triangle' ? 'border-white bg-white text-[#1c0f24]' : 'border-white/15 text-white/70'}`}
                          >▴</button>
                        </div>
                      </div>

                      <div className="rounded-3xl bg-[#241530]/95 p-4">
                        <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/40">Difficulty</div>
                        <div className="mt-4 flex gap-2 rounded-full bg-[#1c0f24]/90 p-1">
                          {['easy', 'medium', 'hard'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setDifficulty(level as "easy" | "medium" | "hard")}
                              className={`flex-1 rounded-full py-3 text-sm ${difficulty === level ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-[#1c0f24] font-semibold' : 'text-white/70'}`}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-3xl bg-[#241530]/95 p-4">
                        <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/40">
                          Music
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <label className="flex-1 cursor-pointer rounded-full border border-white/15 px-4 py-3 text-sm text-white/70 hover:bg-white/5 transition text-center truncate">
                            {customAudioName ? customAudioName : "Choose a song from your device…"}
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={(e) => handleAudioFileSelect(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          {customAudioUrl && (
                            <button
                              onClick={() => handleAudioFileSelect(null)}
                              className="rounded-full border border-white/15 px-3 py-3 text-sm text-white/60 hover:bg-white/5"
                              aria-label="Remove selected song"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {customAudioUrl && (
                          <div className="mt-4 space-y-3">
                            <label className="flex items-center gap-2 text-xs text-white/50">
                              <input
                                type="checkbox"
                                checked={musicEnabled}
                                onChange={(e) => setMusicEnabled(e.target.checked)}
                              />
                              Play during game
                            </label>
                            <label className="flex items-center gap-2 text-xs text-white/50">
                              <input
                                type="checkbox"
                                checked={musicLoop}
                                onChange={(e) => setMusicLoop(e.target.checked)}
                              />
                              Loop track
                            </label>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-white/40 uppercase tracking-[0.2em]">Vol</span>
                              <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={musicVolume}
                                onChange={(e) => setMusicVolume(Number(e.target.value))}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        )}

                        <p className="mt-3 text-[10px] text-white/30">
                          Stays on your device only — nothing is uploaded or saved.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setAppPhase('intro')}
                        className="flex-1 rounded-full border border-white/15 px-4 py-3 text-sm text-white/70 hover:bg-white/5 transition"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleStart}
                        className="flex-1 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 px-4 py-3 text-sm font-semibold text-[#1c0f24] btn-primary"
                      >
                        Start Game
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === "gameover" && (
            <GameOverModal
              score={score}
              highScore={highScore}
              isNewHighScore={isNewHighScore}
              onSubmitScore={() => handleSubmitLeaderboard(score)}
              isSubmittingScore={isSubmittingScore}
              submittedRank={submittedRank}
              submissionMessage={submissionMessage}
              submissionError={submissionError}
              topScores={leaderboard}
              onRestart={handleRestart}
              onSelectDifficulty={(lvl) => {
                setDifficulty(lvl);
                engineRef.current?.setDifficulty(lvl);
                setAppPhase("playing");
                engineRef.current?.start();
              }}
              onCustomize={handleCustomizeAgain}
              onReturnHome={() => {
                setAppPhase("intro");
                setState("idle");
                engineRef.current?.stop();
              }}
            />
          )}
        </div>
      </div>
    </AudioProvider>
  );
}