import { describe, it, expect } from "vitest";
import {
  parseMessageContent,
  serializeMessage,
  formatSeconds,
  formatFileSize,
  RichMessageData,
} from "../components/messaging/types";

describe("Institution Communication Hub Tests", () => {
  it("parses legacy plain text messages correctly", () => {
    const raw = "السلام عليكم ورحمة الله";
    const result = parseMessageContent(raw);
    expect(result.type).toBe("text");
    expect(result.text).toBe("السلام عليكم ورحمة الله");
  });

  it("serializes and parses rich text messages", () => {
    const data: RichMessageData = {
      type: "text",
      text: "مرحباً بكم في اجتماع مجلس الكلية",
    };
    const serialized = serializeMessage(data);
    expect(serialized.startsWith("__UG_RICH_MSG__")).toBe(true);

    const parsed = parseMessageContent(serialized);
    expect(parsed.type).toBe("text");
    expect(parsed.text).toBe("مرحباً بكم في اجتماع مجلس الكلية");
  });

  it("serializes and parses voice note messages with duration", () => {
    const data: RichMessageData = {
      type: "voice",
      url: "https://example.com/voice.webm",
      duration: 45,
    };
    const serialized = serializeMessage(data);
    const parsed = parseMessageContent(serialized);

    expect(parsed.type).toBe("voice");
    expect(parsed.url).toBe("https://example.com/voice.webm");
    expect(parsed.duration).toBe(45);
  });

  it("serializes and parses document / file attachments", () => {
    const data: RichMessageData = {
      type: "file",
      url: "https://example.com/schedule.pdf",
      fileName: "الجدول_الدراسي_2026.pdf",
      fileSize: 1048576, // 1 MB
    };
    const serialized = serializeMessage(data);
    const parsed = parseMessageContent(serialized);

    expect(parsed.type).toBe("file");
    expect(parsed.fileName).toBe("الجدول_الدراسي_2026.pdf");
    expect(parsed.fileSize).toBe(1048576);
  });

  it("serializes and parses completed video call logs", () => {
    const data: RichMessageData = {
      type: "call_log",
      callType: "video",
      callStatus: "completed",
      callDuration: 320,
    };
    const serialized = serializeMessage(data);
    const parsed = parseMessageContent(serialized);

    expect(parsed.type).toBe("call_log");
    expect(parsed.callType).toBe("video");
    expect(parsed.callStatus).toBe("completed");
    expect(parsed.callDuration).toBe(320);
  });

  it("formats seconds into mm:ss accurately", () => {
    expect(formatSeconds(0)).toBe("00:00");
    expect(formatSeconds(9)).toBe("00:09");
    expect(formatSeconds(65)).toBe("01:05");
    expect(formatSeconds(3600)).toBe("60:00");
  });

  it("formats file sizes cleanly", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });
});
