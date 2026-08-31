import React, { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare,
  Maximize2, Minimize2, Users, Volume2, ShieldCheck,
  Radio, Sparkles, Check, Phone, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Contact, formatSeconds } from "./types";
import { toast } from "@/hooks/use-toast";

interface VideoCallModalProps {
  callType: "video" | "audio";
  contact: Contact;
  currentUserId: string;
  institutionId: string;
  isIncoming?: boolean;
  incomingOffer?: any;
  onEndCall: (duration: number) => void;
  isRtl?: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  callType: initialCallType,
  contact,
  currentUserId,
  institutionId,
  isIncoming = false,
  incomingOffer = null,
  onEndCall,
  isRtl = true,
}) => {
  const [callState, setCallState] = useState<"ringing" | "connected" | "ended">(
    isIncoming ? "ringing" : "ringing"
  );
  const [callType, setCallType] = useState<"video" | "audio">(initialCallType);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(initialCallType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Setup Signaling Channel via Supabase Realtime Broadcast
  useEffect(() => {
    const channelName = `inst-call-${institutionId}-${[currentUserId, contact.user_id].sort().join("-")}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "call_signal" }, async (payload) => {
        const data = payload.payload;
        if (data.senderId === currentUserId) return;

        if (data.type === "offer" && isIncoming) {
          // Handled or received
        } else if (data.type === "answer" && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.sdp)
            );
            setCallState("connected");
          } catch (e) {
            console.warn("Set remote description error:", e);
          }
        } else if (data.type === "ice_candidate" && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (e) {
            console.warn("Add ICE candidate error:", e);
          }
        } else if (data.type === "call_ended") {
          handleCleanupAndEnd();
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (!isIncoming) {
            // Start local media and send offer
            await initMediaAndSendOffer(channel);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      cleanupMedia();
    };
  }, []);

  // Timer for connected call duration
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const cleanupMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleCleanupAndEnd = () => {
    cleanupMedia();
    setCallState("ended");
    onEndCall(callDuration);
  };

  const endCall = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call_signal",
        payload: { type: "call_ended", senderId: currentUserId },
      });
    }
    handleCleanupAndEnd();
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "call_signal",
          payload: {
            type: "ice_candidate",
            candidate: event.candidate,
            senderId: currentUserId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const initMediaAndSendOffer = async (channel: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channel.send({
        type: "broadcast",
        event: "call_signal",
        payload: {
          type: "offer",
          sdp: offer,
          callType,
          senderId: currentUserId,
        },
      });
    } catch (err: any) {
      console.warn("Media init error:", err);
      toast({
        title: isRtl ? "تعذر تشغيل الكاميرا/المايكروفون" : "Media Device Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const acceptIncomingCall = async () => {
    try {
      setCallState("connected");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (incomingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "call_signal",
            payload: {
              type: "answer",
              sdp: answer,
              senderId: currentUserId,
            },
          });
        }
      }
    } catch (err: any) {
      console.error("Accept call error:", err);
      toast({
        title: isRtl ? "فشل بدء المكالمة" : "Failed to establish call",
        description: err.message,
        variant: "destructive",
      });
      handleCleanupAndEnd();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenSharing();
      }
    } catch (err) {
      console.warn("Screen share cancelled or failed:", err);
    }
  };

  const stopScreenSharing = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender && videoTrack) {
        videoSender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-white p-4 animate-fade-in"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="relative w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden bg-slate-900/90 border border-teal-500/30 flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/60 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              {callType === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {contact.full_name}
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                  <ShieldCheck className="w-3 h-3 me-1 inline" />
                  {isRtl ? "اتصال مشفر آمن" : "Encrypted P2P"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {callState === "ringing"
                  ? isRtl ? "جاري الاتصال..." : "Ringing..."
                  : isRtl ? `مدة المكالمة: ${formatSeconds(callDuration)}` : `Duration: ${formatSeconds(callDuration)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="rounded-xl text-slate-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Remote Video Stream or Avatar */}
          {callState === "connected" && callType === "video" ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-teal-500/30">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={contact.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    contact.full_name.charAt(0)
                  )}
                </div>
                {callState === "ringing" && (
                  <span className="absolute inset-0 rounded-full border-4 border-teal-400 animate-ping opacity-50" />
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {contact.full_name}
                </h2>
                <p className="text-sm text-teal-300 font-bold mt-1">
                  {callState === "ringing"
                    ? isRtl ? "في انتظار الرد..." : "Calling..."
                    : isRtl ? "مكالمة صوتية عالية الدقة نشطة" : "HD Audio Call Active"}
                </p>
              </div>

              {callState === "connected" && (
                <div className="flex items-center gap-1.5 h-8 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      className="w-1 bg-emerald-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.max(4, ((i * 5) % 24) + 6)}px`,
                        animationDuration: `${0.3 + (i % 4) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Local Floating Camera Preview */}
          {callType === "video" && (
            <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-teal-500/50 shadow-2xl bg-slate-900 z-30">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              <span className="absolute bottom-1.5 right-2 text-[10px] font-black bg-slate-950/80 px-1.5 py-0.5 rounded text-teal-300">
                {isRtl ? "أنت" : "You"}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="p-4 px-6 bg-slate-950/80 backdrop-blur border-t border-white/10 flex items-center justify-center gap-3 sm:gap-4 z-20">
          {isIncoming && callState === "ringing" ? (
            <div className="flex items-center gap-4">
              <Button
                onClick={acceptIncomingCall}
                className="h-12 px-6 gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30"
              >
                <Phone className="w-5 h-5" />
                <span>{isRtl ? "قبول المكالمة" : "Accept Call"}</span>
              </Button>
              <Button
                onClick={endCall}
                variant="destructive"
                className="h-12 px-6 gap-2 rounded-2xl font-black text-sm shadow-xl"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{isRtl ? "رفض" : "Decline"}</span>
              </Button>
            </div>
          ) : (
            <>
              {/* Mic Toggle */}
              <Button
                onClick={toggleMute}
                variant={isAudioMuted ? "destructive" : "outline"}
                size="icon"
                className="w-12 h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15"
                title={isAudioMuted ? "Unmute" : "Mute"}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-teal-400" />}
              </Button>

              {/* Video Camera Toggle */}
              {callType === "video" && (
                <Button
                  onClick={toggleVideo}
                  variant={isVideoDisabled ? "destructive" : "outline"}
                  size="icon"
                  className="w-12 h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15"
                  title={isVideoDisabled ? "Enable Camera" : "Disable Camera"}
                >
                  {isVideoDisabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5 text-teal-400" />}
                </Button>
              )}

              {/* Screen Share */}
              {callType === "video" && (
                <Button
                  onClick={toggleScreenShare}
                  variant={isScreenSharing ? "secondary" : "outline"}
                  size="icon"
                  className={`w-12 h-12 rounded-2xl border-white/20 ${
                    isScreenSharing ? "bg-teal-500 text-white" : "bg-white/5 hover:bg-white/15 text-slate-300"
                  }`}
                  title="Share Screen"
                >
                  <ScreenShare className="w-5 h-5" />
                </Button>
              )}

              {/* End Call Button */}
              <Button
                onClick={endCall}
                className="h-12 px-6 gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/30"
              >
                <PhoneOff className="w-5 h-5" />
                <span>{isRtl ? "إنهاء المكالمة" : "End Call"}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
