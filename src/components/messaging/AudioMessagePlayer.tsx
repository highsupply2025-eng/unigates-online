import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSeconds } from "./types";

interface AudioMessagePlayerProps {
  src: string;
  duration?: number;
  isMe?: boolean;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  src,
  duration = 0,
  isMe = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.warn("Audio play error:", e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    audio.playbackRate = nextSpeed;
    setSpeed(nextSpeed);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[240px] max-w-[320px] select-none ${
        isMe
          ? "bg-teal-700/60 text-white border border-white/20"
          : "bg-slate-900/80 text-white border border-white/10 dark:bg-slate-950/80"
      }`}
      dir="ltr"
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
          isMe
            ? "bg-white text-teal-700 hover:bg-teal-50"
            : "bg-teal-500 text-white hover:bg-teal-400"
        }`}
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {/* Animated Sound Wave Bars */}
        <div className="flex items-center gap-[3px] h-5 px-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const height = Math.sin((i / 24) * Math.PI) * 14 + 4 + ((i % 3) * 2);
            const isPassed = (i / 24) * 100 <= progressPercent;
            return (
              <span
                key={i}
                style={{ height: `${height}px` }}
                className={`w-[3px] rounded-full transition-all duration-150 ${
                  isPassed
                    ? isMe ? "bg-white" : "bg-teal-400"
                    : isMe ? "bg-white/40" : "bg-slate-600"
                } ${isPlaying && isPassed ? "animate-pulse" : ""}`}
              />
            );
          })}
        </div>

        {/* Range slider for scrubbing */}
        <input
          type="range"
          min={0}
          max={totalDuration || 1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-transparent appearance-none cursor-pointer accent-teal-400 opacity-0 hover:opacity-100 transition-opacity absolute inset-0"
        />

        {/* Time and speed */}
        <div className="flex items-center justify-between text-[11px] font-mono px-1 opacity-90">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(totalDuration)}</span>
        </div>
      </div>

      {/* Playback speed toggle */}
      <button
        onClick={cycleSpeed}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black shrink-0 transition-colors ${
          isMe
            ? "bg-white/20 hover:bg-white/30 text-white"
            : "bg-white/10 hover:bg-white/20 text-teal-300"
        }`}
        title="Playback Speed"
      >
        {speed}x
      </button>
    </div>
  );
};
