import React, { useState, useEffect, useRef } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare,
  Maximize2, Minimize2, Users, Volume2, ShieldCheck,
  Radio, Sparkles, Check, Phone, Loader2, Paperclip,
  Download, FileText, Image as ImageIcon, Plus, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Contact, formatSeconds, formatFileSize } from "./types";
import { toast } from "@/hooks/use-toast";
import { callInboxTopic, privateChannel, sendToPrivateInbox } from "@/lib/realtime/privateChannels";

interface SharedCallFile {
  id: string;
  senderName: string;
  fileName: string;
  fileSize?: number;
  url: string;
  type: "file" | "image";
  uploadedAt: string;
}

interface Participant {
  user_id: string;
  full_name: string;
  photo_url?: string | null;
  role?: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface VideoCallModalProps {
  callType: "video" | "audio";
  contact: Contact;
  currentUserId: string;
  currentUserName?: string;
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
  currentUserName = "أنا",
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

  // 20-Person Multi-Participant & File Sharing States
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedCallFile[]>([]);
  const [showFilesDrawer, setShowFilesDrawer] = useState(false);
  const [showParticipantsDrawer, setShowParticipantsDrawer] = useState(false);
  const [isUploadingCallFile, setIsUploadingCallFile] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Setup Signaling Channel via Supabase Realtime Broadcast (Conference Room Mesh up to 20 users)
  useEffect(() => {
    // Each participant listens only on their own private inbox topic and
    // publishes into the peer's inbox, so no third party can subscribe.
    const inboxTopic = callInboxTopic(currentUserId, institutionId, contact.user_id);
    const peerTopic = callInboxTopic(contact.user_id, institutionId, currentUserId);
    const channel = privateChannel(inboxTopic);
    const sender = {
      send: (msg: { event: string; payload: unknown }) =>
        sendToPrivateInbox(peerTopic, msg.event, msg.payload),
    };

    channel
      .on("broadcast", { event: "call_signal" }, async (payload) => {
        const data = payload.payload;
        if (data.senderId === currentUserId) return;

        if (data.type === "user_joined") {
          // Add participant to state if not present (up to 20)
          setParticipants((prev) => {
            if (prev.some((p) => p.user_id === data.senderId)) return prev;
            if (prev.length >= 19) return prev; // max 20 including local
            return [
              ...prev,
              {
                user_id: data.senderId,
                full_name: data.senderName || contact.full_name,
                photo_url: data.photoUrl || contact.photo_url,
                role: data.role,
              },
            ];
          });

          // Create offer to the newly joined peer
          if (localStreamRef.current) {
            await createAndSendOfferToPeer(data.senderId, sender);
          }
        } else if (data.type === "offer") {
          if (data.targetId && data.targetId !== currentUserId) return;
          await handleReceiveOffer(data.senderId, data.sdp, sender, data.senderName, data.photoUrl);
        } else if (data.type === "answer") {
          if (data.targetId && data.targetId !== currentUserId) return;
          const pc = peerConnectionsRef.current.get(data.senderId);
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              setCallState("connected");
            } catch (e) {
              console.warn("Set remote description error:", e);
            }
          }
        } else if (data.type === "ice_candidate") {
          if (data.targetId && data.targetId !== currentUserId) return;
          const pc = peerConnectionsRef.current.get(data.senderId);
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (e) {
              console.warn("Add ICE candidate error:", e);
            }
          }
        } else if (data.type === "file_shared") {
          setSharedFiles((prev) => [data.file, ...prev]);
          toast({
            title: isRtl ? "ملف جديد مشترك بالمكالمة" : "New shared file in call",
            description: `${data.file.senderName}: ${data.file.fileName}`,
          });
        } else if (data.type === "user_left") {
          removePeer(data.senderId);
        } else if (data.type === "call_ended") {
          handleCleanupAndEnd();
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: callType === "video",
              audio: true,
            });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }

            // Announce join
            sender.send({
              type: "broadcast",
              event: "call_signal",
              payload: {
                type: "user_joined",
                senderId: currentUserId,
                senderName: currentUserName,
                photoUrl: null,
                callType,
              },
            });

            if (!isIncoming) {
              setParticipants([
                {
                  user_id: contact.user_id,
                  full_name: contact.full_name,
                  photo_url: contact.photo_url,
                  role: contact.specific_role,
                },
              ]);
            }
          } catch (err: any) {
            console.warn("Media stream init error:", err);
            toast({
              title: isRtl ? "تعذر تشغيل الكاميرا/المايكروفون" : "Media Device Error",
              description: err.message,
              variant: "destructive",
            });
          }
        }
      });

    channelRef.current = sender;

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
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
  };

  const removePeer = (peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    setParticipants((prev) => prev.filter((p) => p.user_id !== peerId));
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

  const createPeerConnection = (peerId: string, peerName?: string, photoUrl?: string | null) => {
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
            targetId: peerId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        setParticipants((prev) => {
          const idx = prev.findIndex((p) => p.user_id === peerId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], stream: remoteStream };
            return copy;
          } else {
            return [
              ...prev,
              {
                user_id: peerId,
                full_name: peerName || contact.full_name,
                photo_url: photoUrl || contact.photo_url,
                stream: remoteStream,
              },
            ];
          }
        });
        setCallState("connected");
      }
    };

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  };

  const createAndSendOfferToPeer = async (peerId: string, channel: any) => {
    try {
      const pc = createPeerConnection(peerId);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }
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
          senderName: currentUserName,
          targetId: peerId,
        },
      });
    } catch (e) {
      console.warn("createAndSendOffer error:", e);
    }
  };

  const handleReceiveOffer = async (peerId: string, offerSdp: any, channel: any, peerName?: string, photoUrl?: string | null) => {
    try {
      const pc = createPeerConnection(peerId, peerName, photoUrl);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channel.send({
        type: "broadcast",
        event: "call_signal",
        payload: {
          type: "answer",
          sdp: answer,
          senderId: currentUserId,
          targetId: peerId,
        },
      });
      setCallState("connected");
    } catch (e) {
      console.warn("handleReceiveOffer error:", e);
    }
  };

  const acceptIncomingCall = async () => {
    setCallState("connected");
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "call_signal",
        payload: {
          type: "user_joined",
          senderId: currentUserId,
          senderName: currentUserName,
          callType,
        },
      });
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

        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

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
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === "video");
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
      });
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

  // In-Call File Upload & Broadcast to All Room Participants
  const handleInCallFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !channelRef.current) return;

    setIsUploadingCallFile(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `call_room_files/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from("course-content")
        .upload(path, file, { upsert: true });

      let publicUrl = "";
      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from("course-content")
          .getPublicUrl(path);
        publicUrl = pubData.publicUrl;
      } else {
        publicUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const isImg = file.type.startsWith("image/");
      const sharedFile: SharedCallFile = {
        id: `call-file-${Date.now()}`,
        senderName: currentUserName,
        fileName: file.name,
        fileSize: file.size,
        url: publicUrl,
        type: isImg ? "image" : "file",
        uploadedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSharedFiles((prev) => [sharedFile, ...prev]);
      setShowFilesDrawer(true);

      // Broadcast to all participants in call
      channelRef.current.send({
        type: "broadcast",
        event: "call_signal",
        payload: {
          type: "file_shared",
          senderId: currentUserId,
          file: sharedFile,
        },
      });

      toast({
        title: isRtl ? "تمت مشاركة الملف في المكالمة بنجاح" : "File shared in call successfully",
      });
    } catch (err: any) {
      console.error("In-call file upload error:", err);
      toast({
        title: isRtl ? "فشل مشاركة الملف" : "Failed to share file",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingCallFile(false);
      if (fileUploadInputRef.current) fileUploadInputRef.current.value = "";
    }
  };

  const totalParticipantsCount = participants.length + 1; // including local user

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl text-white p-2 sm:p-4 animate-fade-in"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Hidden File Upload Input for Call */}
      <input
        ref={fileUploadInputRef}
        type="file"
        className="hidden"
        onChange={handleInCallFileUpload}
      />

      <div className="relative w-full max-w-7xl h-[92vh] rounded-3xl overflow-hidden bg-slate-900/90 border border-teal-500/30 flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-slate-950/70 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              {callType === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {participants.length > 1 ? (isRtl ? "غرفة اجتماع مرئي مشترك" : "Multi-Party Video Room") : contact.full_name}
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                  <ShieldCheck className="w-3 h-3 me-1 inline" />
                  {isRtl ? "مشفر P2P" : "Encrypted P2P"}
                </Badge>
                <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black">
                  <Users className="w-3 h-3 me-1 inline" />
                  {totalParticipantsCount} / 20 {isRtl ? "مشارك" : "Peers"}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {callState === "ringing"
                  ? isRtl ? "جاري الاتصال والربط..." : "Connecting..."
                  : isRtl ? `مدة المكالمة: ${formatSeconds(callDuration)}` : `Duration: ${formatSeconds(callDuration)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Shared Files Toggle Button */}
            <Button
              variant={showFilesDrawer ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setShowFilesDrawer(!showFilesDrawer);
                setShowParticipantsDrawer(false);
              }}
              className="rounded-xl border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold gap-1.5"
            >
              <Paperclip className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">{isRtl ? "الملفات المشتركة" : "Files"}</span>
              {sharedFiles.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-teal-500 text-[10px] font-black flex items-center justify-center text-white">
                  {sharedFiles.length}
                </span>
              )}
            </Button>

            {/* Participants Toggle Button */}
            <Button
              variant={showParticipantsDrawer ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setShowParticipantsDrawer(!showParticipantsDrawer);
                setShowFilesDrawer(false);
              }}
              className="rounded-xl border-white/20 bg-white/5 hover:bg-white/15 text-xs font-bold gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{isRtl ? "المشاركون" : "Participants"}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">
                {totalParticipantsCount}
              </span>
            </Button>

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

        {/* Video Canvas Area with Multi-Peer Grid up to 20 users */}
        <div className="flex-1 relative bg-slate-950 flex overflow-hidden">
          {/* Main Grid Area */}
          <div className="flex-1 p-2 sm:p-4 overflow-y-auto custom-scrollbar flex items-center justify-center">
            {callType === "video" ? (
              <div
                className={`w-full h-full grid gap-2 sm:gap-3 items-center justify-center auto-rows-fr ${
                  totalParticipantsCount <= 1
                    ? "grid-cols-1 max-w-4xl"
                    : totalParticipantsCount <= 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : totalParticipantsCount <= 4
                    ? "grid-cols-2"
                    : totalParticipantsCount <= 6
                    ? "grid-cols-2 sm:grid-cols-3"
                    : totalParticipantsCount <= 9
                    ? "grid-cols-3 sm:grid-cols-3"
                    : totalParticipantsCount <= 12
                    ? "grid-cols-3 sm:grid-cols-4"
                    : "grid-cols-4 sm:grid-cols-5"
                }`}
              >
                {/* Local User Tile */}
                <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/40 shadow-xl flex items-center justify-center group">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  {isVideoDisabled && (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xl">
                        {currentUserName.charAt(0)}
                      </div>
                      <span className="text-xs text-slate-400 font-bold">{isRtl ? "الكاميرا مغلقة" : "Camera Off"}</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-black bg-slate-950/80 backdrop-blur px-2 py-1 rounded-lg text-teal-300 border border-teal-500/20">
                      {isRtl ? "أنت (المضيف)" : "You (Host)"}
                    </span>
                    {isAudioMuted && (
                      <span className="bg-rose-500/80 p-1 rounded-md text-white">
                        <MicOff className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Remote Participants Tiles (Up to 19 others) */}
                {participants.map((peer) => (
                  <ParticipantVideoTile key={peer.user_id} peer={peer} isRtl={isRtl} />
                ))}
              </div>
            ) : (
              /* Audio Only Call Mode */
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
                      : isRtl ? "مكالمة صوتية عالية الدقة نشطة (حتى 20 شخص)" : "HD Audio Call Active (Up to 20 peers)"}
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
          </div>

          {/* In-Call Shared Files Drawer */}
          {showFilesDrawer && (
            <div className="w-80 sm:w-96 bg-slate-900/95 border-s border-white/10 flex flex-col p-4 z-30 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-teal-400" />
                  <h4 className="font-black text-sm text-white">
                    {isRtl ? "الملفات المرفوعة بالمكالمة" : "In-Call Shared Files"}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilesDrawer(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Upload Button */}
              <div className="py-3">
                <Button
                  onClick={() => fileUploadInputRef.current?.click()}
                  disabled={isUploadingCallFile}
                  className="w-full h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-black text-xs gap-2 shadow-lg shadow-teal-500/20"
                >
                  {isUploadingCallFile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isRtl ? "رفع ومشاركة ملف للجميع" : "Upload & Share File"}</span>
                </Button>
              </div>

              {/* Files List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pe-1 custom-scrollbar">
                {sharedFiles.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-teal-400" />
                    <p>{isRtl ? "لم يتم مشاركة ملفات حتى الآن" : "No files shared yet in this call"}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isRtl ? "يمكنك رفع مستندات وعروض تقديمية وصور فورياً لجميع المشاركين" : "You can share docs, slides, and images in real-time"}
                    </p>
                  </div>
                ) : (
                  sharedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-400">
                          {file.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate" title={file.fileName}>
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{file.senderName}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.fileSize)}</span>
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download={file.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-teal-500 text-white flex items-center justify-center shrink-0 transition-colors"
                        title={isRtl ? "تحميل الملف" : "Download File"}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* In-Call Participants Drawer */}
          {showParticipantsDrawer && (
            <div className="w-72 sm:w-80 bg-slate-900/95 border-s border-white/10 flex flex-col p-4 z-30 animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-black text-sm text-white">
                    {isRtl ? `المشاركون بالمكالمة (${totalParticipantsCount}/20)` : `Participants (${totalParticipantsCount}/20)`}
                  </h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowParticipantsDrawer(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3 pe-1 custom-scrollbar">
                {/* Local user */}
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-black">
                      {currentUserName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{currentUserName} ({isRtl ? "أنت" : "You"})</p>
                      <p className="text-[10px] text-teal-300 font-bold">{isRtl ? "مضيف المكالمة" : "Host"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-teal-400">
                    {isAudioMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Other peers */}
                {participants.map((p) => (
                  <div key={p.user_id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{p.full_name}</p>
                        <p className="text-[10px] text-slate-400">{p.role || (isRtl ? "عضو" : "Member")}</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px]">
                      {isRtl ? "متصل" : "Live"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 bg-slate-950/90 backdrop-blur border-t border-white/10 flex items-center justify-center gap-2 sm:gap-4 z-20 flex-wrap">
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
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15"
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
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15"
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
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-white/20 ${
                    isScreenSharing ? "bg-teal-500 text-white" : "bg-white/5 hover:bg-white/15 text-slate-300"
                  }`}
                  title="Share Screen"
                >
                  <ScreenShare className="w-5 h-5" />
                </Button>
              )}

              {/* File Attachment in Call Button */}
              <Button
                onClick={() => fileUploadInputRef.current?.click()}
                disabled={isUploadingCallFile}
                variant="outline"
                size="icon"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-white/20 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-teal-400"
                title={isRtl ? "مشاركة ملف بالمكالمة" : "Share File"}
              >
                {isUploadingCallFile ? (
                  <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </Button>

              {/* End Call Button */}
              <Button
                onClick={endCall}
                className="h-11 sm:h-12 px-5 sm:px-6 gap-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/30"
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

// Subcomponent for each remote peer video tile
const ParticipantVideoTile: React.FC<{ peer: Participant; isRtl: boolean }> = ({ peer, isRtl }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl flex items-center justify-center group">
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
            {peer.photo_url ? (
              <img src={peer.photo_url} alt={peer.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              peer.full_name.charAt(0)
            )}
          </div>
          <p className="text-xs font-bold text-white truncate max-w-[120px]">{peer.full_name}</p>
          <Badge className="bg-white/10 text-[10px] text-slate-300 border-none">
            {isRtl ? "جاري البث..." : "Connecting stream..."}
          </Badge>
        </div>
      )}

      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between pointer-events-none">
        <span className="text-[11px] font-black bg-slate-950/80 backdrop-blur px-2 py-1 rounded-lg text-white border border-white/10 truncate max-w-[140px]">
          {peer.full_name}
        </span>
      </div>
    </div>
  );
};

