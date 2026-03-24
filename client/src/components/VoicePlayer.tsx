import { useState, useRef, useEffect, useCallback, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Radio, Volume2, Mic, Minimize2, ChevronDown, ChevronUp, X } from "lucide-react";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface Token {
  text: string;
  tsIndex: number | null;
}

interface VoicePlayerProps {
  cityId: string;
  cityName: string;
  isAdmin: boolean;
  titleRef?: RefObject<HTMLHeadingElement>;
  contentEndRef?: RefObject<HTMLDivElement>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecsUntil4pm(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0");
  const nowSecs = get("hour") * 3600 + get("minute") * 60 + get("second");
  const targetSecs = 16 * 3600;
  return nowSecs <= targetSecs ? targetSecs - nowSecs : -1;
}

function formatCountdown(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function tokenize(text: string): Token[] {
  if (!text) return [];
  const raw = text.split(/(\s+)/);
  let tsIndex = 0;
  return raw.map(chunk => {
    if (/^\s+$/.test(chunk)) return { text: chunk, tsIndex: null };
    const hasAlphanum = /[a-zA-Z0-9]/.test(chunk);
    if (hasAlphanum) return { text: chunk, tsIndex: tsIndex++ };
    return { text: chunk, tsIndex: null };
  });
}

function findActiveWord(timestamps: WordTimestamp[], currentTime: number): number {
  if (!timestamps.length) return -1;
  let lo = 0, hi = timestamps.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid].end < currentTime) lo = mid + 1;
    else if (timestamps[mid].start > currentTime) hi = mid - 1;
    else return mid;
  }
  return lo < timestamps.length ? lo : timestamps.length - 1;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VoicePlayer({ cityId, cityName, isAdmin, titleRef, contentEndRef }: VoicePlayerProps) {
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [progress, setProgress] = useState(0);
  const [secsLeft, setSecsLeft] = useState(() => getSecsUntil4pm());
  const [timestamps, setTimestamps] = useState<WordTimestamp[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [isCached, setIsCached] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const autoPlayFiredRef = useRef(false);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const textPanelRef = useRef<HTMLDivElement | null>(null);
  const timestampsRef = useRef<WordTimestamp[]>([]);

  const scrollActiveWord = useCallback(() => {
    if (activeWordRef.current && textPanelRef.current) {
      activeWordRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => setSecsLeft(getSecsUntil4pm()), 1000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || audioState !== "idle" || autoPlayFiredRef.current) return;
    if (secsLeft === 0) {
      autoPlayFiredRef.current = true;
      handleListen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft, isAdmin, audioState]);

  useEffect(() => {
    if (activeWordIdx >= 0) scrollActiveWord();
  }, [activeWordIdx, scrollActiveWord]);

  async function handleListen() {
    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("paused");
      return;
    }
    if (audioState === "paused" && audioRef.current) {
      audioRef.current.play();
      setAudioState("playing");
      return;
    }

    setAudioState("loading");
    setModalOpen(true);
    setMinimized(false);

    try {
      const res = await fetch(`/api/tts/${cityId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("TTS failed");

      const data = await res.json() as {
        audioBase64: string;
        timestamps: WordTimestamp[];
        text: string;
      };

      setIsCached(true);
      setIsSynced(data.timestamps.length > 0);
      setTimestamps(data.timestamps);
      timestampsRef.current = data.timestamps;
      setTokens(tokenize(data.text));
      setActiveWordIdx(-1);

      const binaryStr = atob(data.audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        const prog = (audio.currentTime / audio.duration) * 100;
        setProgress(prog);
        if (timestampsRef.current.length > 0) {
          setActiveWordIdx(findActiveWord(timestampsRef.current, audio.currentTime));
        }
      });

      audio.addEventListener("ended", () => {
        setAudioState("idle");
        setProgress(0);
        setActiveWordIdx(-1);
      });

      await audio.play();
      setAudioState("playing");
    } catch {
      setAudioState("idle");
      setModalOpen(false);
    }
  }

  function handleStop() {
    audioRef.current?.pause();
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
    audioRef.current = null;
    setAudioState("idle");
    setProgress(0);
    setActiveWordIdx(-1);
    setModalOpen(false);
    setMinimized(false);
  }

  // ─── Public view (Tune-In card) ─────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <a
        href="https://eacd.us"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-3 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
      >
        <Radio className="h-5 w-5 text-white shrink-0" />
        <p className="text-sm font-semibold text-white leading-snug">
          Hear today's city read live — every day at <span className="text-yellow-300">4pm ET</span> on eacd.us
        </p>
      </a>
    );
  }

  // ─── Admin: inline trigger button ────────────────────────────────────────────
  const hasTokens = tokens.length > 0;

  return (
    <>
      {/* Inline trigger */}
      <div className="w-full max-w-md mx-auto rounded-md bg-white/10 border border-white/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="h-4 w-4 text-white/80" />
          <span className="text-sm font-semibold text-white">AI Voice Reader</span>
          <span className="ml-auto text-xs text-white/60">
            {audioState === "idle" && secsLeft > 300 && "Auto-plays at 4:00 PM ET"}
            {audioState === "idle" && secsLeft > 0 && secsLeft <= 300 && (
              <span className="animate-pulse text-yellow-300">
                Auto-plays in {formatCountdown(secsLeft)}
              </span>
            )}
          </span>
        </div>

        <Button
          size="default"
          variant="ghost"
          className="w-full text-white border border-white/30"
          onClick={audioState === "idle" ? handleListen : () => setModalOpen(true)}
          disabled={audioState === "loading"}
          data-testid="button-voice-play"
        >
          {audioState === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Generating audio...
            </span>
          ) : audioState === "playing" || audioState === "paused" ? (
            <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Open Live Reader</span>
          ) : (
            <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Play</span>
          )}
        </Button>
      </div>

      {/* ── Floating reading modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: minimized ? "auto" : "80vh" }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-start gap-3">
                {/* Mic icon */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>

                {/* Title + badges + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      Daily Reading — {cityName}
                    </span>
                    {isCached && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">cached</span>
                    )}
                    {isSynced && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">synced</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {audioState === "loading" && "Generating audio..."}
                    {audioState === "playing" && "Now playing..."}
                    {audioState === "paused" && "Paused"}
                    {audioState === "idle" && "Ready"}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleListen}
                    disabled={audioState === "loading"}
                    data-testid="button-voice-play-modal"
                  >
                    {audioState === "playing"
                      ? <Pause className="w-4 h-4" />
                      : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-gray-500"
                    onClick={() => setMinimized(m => !m)}
                    title={minimized ? "Expand" : "Minimize"}
                  >
                    {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-gray-500"
                    onClick={handleStop}
                    data-testid="button-voice-stop-modal"
                    title="Stop and close"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Live reading body */}
            {!minimized && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Section label */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Live Reading</span>
                </div>

                {/* Scrollable text */}
                <div
                  ref={textPanelRef}
                  className="flex-1 overflow-y-auto px-4 pb-4 text-sm leading-7 text-gray-800"
                  style={{ minHeight: "200px" }}
                >
                  {hasTokens ? (
                    tokens.map((token, i) => {
                      if (/^\s+$/.test(token.text)) {
                        return <span key={i}>{token.text}</span>;
                      }
                      const isActive =
                        isSynced &&
                        token.tsIndex !== null &&
                        token.tsIndex === activeWordIdx;
                      return (
                        <span
                          key={i}
                          ref={isActive ? activeWordRef : undefined}
                          className={
                            isActive
                              ? "bg-yellow-300 font-semibold rounded px-0.5"
                              : token.tsIndex === null
                              ? "text-gray-400"
                              : ""
                          }
                        >
                          {token.text}
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 italic">
                      {audioState === "loading"
                        ? "Generating audio and syncing word timestamps..."
                        : "No text available for this reading."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
