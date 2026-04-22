import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Radio, Users } from "lucide-react";

interface LiveStreamRoomProps {
  streamId: string;
  streamTitle: string;
  isHost: boolean;
  participantName: string;
  onClose: () => void;
}

function StageView() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div style={{ height: "calc(100vh - 120px)" }}>
      <GridLayout tracks={tracks}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

const LiveStreamRoom = ({ streamId, streamTitle, isHost, participantName, onClose }: LiveStreamRoomProps) => {
  const { language } = useLanguage();
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/livekit-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            roomName: streamId,
            participantName,
            isHost,
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to get token");
      }

      const data = await resp.json();
      setToken(data.token);
      setServerUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [streamId, participantName, isHost]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const handleDisconnect = useCallback(async () => {
    if (isHost) {
      await supabase
        .from("live_streams")
        .update({ status: "ended" })
        .eq("id", streamId);
    }
    onClose();
  }, [isHost, streamId, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">
            {language === "ar" ? "جاري الاتصال بالبث المباشر..." : "Connecting to live stream..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {language === "ar" ? "خطأ في الاتصال" : "Connection Error"}
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              {language === "ar" ? "رجوع" : "Go Back"}
            </Button>
            <Button onClick={fetchToken}>
              {language === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !serverUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-destructive animate-pulse" />
          <span className="font-bold text-foreground">{streamTitle}</span>
          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
            {language === "ar" ? "مباشر" : "LIVE"}
          </span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDisconnect}>
          {isHost
            ? (language === "ar" ? "إنهاء البث" : "End Stream")
            : (language === "ar" ? "مغادرة" : "Leave")}
        </Button>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect={true}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default LiveStreamRoom;
