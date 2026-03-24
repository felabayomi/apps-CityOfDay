import { useState, useRef, useEffect, useCallback, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Radio, Volume2 } from "lucide-react";

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface Token {
  text: string;
  /** null for pure-punctuation tokens that TTS doesn't voice */
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

/**
 * Split narration text into tokens. Words that contain at least one alphanumeric
 * character get a sequential tsIndex so they map to Whisper timestamps.
 * Pure-punctuation runs (dashes, em-dashes, etc.) get tsIndex = null.
 */
function tokenize(text: string): Token[] {
  if (!text) return [];
  // Split on whitespace but keep the whitespace as separate tokens for layout
  const raw = text.split(/(\s+)/);
  let tsIndex = 0;
  return raw.map(chunk => {
    if (/\s+/.test(chunk)) return { text: chunk, tsIndex: null };
    const hasAlphanum = /[a-zA-Z0-9]/.test(chunk);
    if (hasAlphanum) {
      return { text: chunk, tsIndex: tsIndex++ };
    }
    return { text: chunk, tsIndex: null };
  });
}

/** Binary search: find the timestamp index whose window contains currentTime. */
function findActiveWord(timestamps: WordTimestamp[], currentTime: number): number {
  if (!timestamps.length) return -1;
  let lo = 0;
  let hi = timestamps.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timestamps[mid].end < currentTime) {
      lo = mid + 1;
    } else if (timestamps[mid].start > currentTime) {
      hi = mid - 1;
    } else {
      return mid;
    }
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);
  const autoPlayFiredRef = useRef(false);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const textPanelRef = useRef<HTMLDivElement | null>(null);

  // Scroll active word into view within the text panel
  const scrollActiveWord = useCallback(() => {
    if (activeWordRef.current && textPanelRef.current) {
      activeWordRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, []);

  // Auto-scroll page in sync with audio (old behavior, kept as fallback)
  const autoScrollToProgress = useCallback((prog: number) => {
    if (!titleRef?.current || !contentEndRef?.current) return;
    const titleTop = titleRef.current.getBoundingClientRect().top + window.scrollY - 90;
    const endBottom = contentEndRef.current.getBoundingClientRect().bottom + window.scrollY;
    const scrollRange = endBottom - titleTop - window.innerHeight * 0.45;
    const targetY = titleTop + scrollRange * (prog / 100);
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
  }, [titleRef, contentEndRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioBlobUrlRef.current) URL.revokeObjectURL(audioBlobUrlRef.current);
    };
  }, []);

  // Countdown tick — admin only
  useEffect(() => {
    if (!isAdmin) return;
    const interval = setInterval(() => setSecsLeft(getSecsUntil4pm()), 1000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Auto-fire at 4pm ET
  useEffect(() => {
    if (!isAdmin || audioState !== "idle" || autoPlayFiredRef.current) return;
    if (secsLeft === 0) {
      autoPlayFiredRef.current = true;
      handleListen();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secsLeft, isAdmin, audioState]);

  // Scroll when active word changes
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

      // Store timestamps + parse tokens
      setTimestamps(data.timestamps);
      setTokens(tokenize(data.text));
      setActiveWordIdx(-1);

      // Build blob URL from base64
      const binaryStr = atob(data.audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      audioBlobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      let lastScrolledAt = -5;
      audio.addEventListener("timeupdate", () => {
        if (!audio.duration) return;
        const prog = (audio.currentTime / audio.duration) * 100;
        setProgress(prog);

        // Word highlighting
        if (data.timestamps.length > 0) {
          const idx = findActiveWord(data.timestamps, audio.currentTime);
          setActiveWordIdx(idx);
        }

        // Page auto-scroll every 3s (only when no timestamps — timestamps scroll via panel)
        if (data.timestamps.length === 0 && audio.currentTime - lastScrolledAt >= 3) {
          lastScrolledAt = audio.currentTime;
          autoScrollToProgress(prog);
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
  }

  // ─── Public view ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-md bg-white/10 border border-white/20">
        <Radio className="h-5 w-5 text-white shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Hear {cityName} Read Live</p>
          <p className="text-xs text-white/70">
            Tune in every day at <strong>4pm ET</strong> on{" "}
            <a href="https://eacd.us" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              eacd.us
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin view ─────────────────────────────────────────────────────────────
  const hasHighlighting = tokens.length > 0 && timestamps.length > 0;
  const showPanel = (audioState === "playing" || audioState === "paused") && tokens.length > 0;

  return (
    <div className="w-full max-w-md mx-auto rounded-md bg-white/10 border border-white/20 p-4">
      {/* Header */}
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
          {audioState === "loading" && "Generating audio..."}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/20 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Live word-highlighting panel */}
      {showPanel && (
        <div
          ref={textPanelRef}
          className="mb-3 max-h-40 overflow-y-auto rounded-md bg-black/30 p-3 text-sm leading-relaxed text-white/90 scroll-smooth"
          style={{ wordBreak: "break-word" }}
        >
          {tokens.map((token, i) => {
            if (/^\s+$/.test(token.text)) {
              return <span key={i}>{token.text}</span>;
            }
            const isActive =
              hasHighlighting &&
              token.tsIndex !== null &&
              token.tsIndex === activeWordIdx;
            return (
              <span
                key={i}
                ref={isActive ? activeWordRef : undefined}
                className={
                  isActive
                    ? "bg-yellow-300 text-black font-semibold rounded px-0.5"
                    : token.tsIndex === null
                    ? "text-white/50"
                    : "text-white/90"
                }
              >
                {token.text}
              </span>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          size="default"
          variant="ghost"
          className="flex-1 text-white border border-white/30"
          onClick={handleListen}
          disabled={audioState === "loading"}
          data-testid="button-voice-play"
        >
          {audioState === "loading" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Generating...
            </span>
          ) : audioState === "playing" ? (
            <span className="flex items-center gap-2"><Pause className="w-4 h-4" /> Pause</span>
          ) : audioState === "paused" ? (
            <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Resume</span>
          ) : (
            <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Play</span>
          )}
        </Button>

        {audioState !== "idle" && (
          <Button
            size="icon"
            variant="ghost"
            className="text-white border border-white/30"
            onClick={handleStop}
            data-testid="button-voice-stop"
          >
            <Square className="w-4 h-4" />
          </Button>
        )}
      </div>

      {audioState === "idle" && (
        <p className="mt-2 text-center text-xs text-white/40">
          {hasHighlighting ? "Live word highlighting ready" : "Play to generate audio with live word highlighting"}
        </p>
      )}
    </div>
  );
}
