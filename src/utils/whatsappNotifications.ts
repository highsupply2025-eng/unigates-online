/**
 * UNIGATES Official Admin WhatsApp Notification Dispatcher
 * Dedicated recipient: 00966563057356 (Saudi Arabia)
 */

export const ADMIN_WHATSAPP_NUMBER = "966563057356";

export interface WhatsAppNotificationPayload {
  type: "registration" | "payment" | "lecture" | "security" | "approval" | "system";
  title: string;
  details: Record<string, string | number | boolean | undefined | null>;
  timestamp?: string;
}

/**
 * Builds a clean, formatted WhatsApp message text
 */
export function formatWhatsAppMessage(payload: WhatsAppNotificationPayload): string {
  const time = payload.timestamp || new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" });
  
  const iconMap: Record<string, string> = {
    registration: "🏢 [تسجيل مؤسسة جديد]",
    payment: "💳 [إشعار دفع جديد]",
    lecture: "🎓 [محاضر / عضو جديد]",
    security: "🛡️ [تنبيه أمني]",
    approval: "✅ [اعتماد إداري]",
    system: "ℹ️ [إشعار المنظومة]",
  };

  const header = iconMap[payload.type] || "🔔 [إشعار UNIGATES]";
  
  let msg = `*${header}*\n*${payload.title}*\n\n`;
  
  Object.entries(payload.details).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      msg += `▫️ *${key}:* ${val}\n`;
    }
  });

  msg += `\n⏰ *التوقيت:* ${time}`;
  msg += `\n🌐 *منظومة UNIGATES التعليمية الرقمية*`;

  return msg;
}

/**
 * Generates direct wa.me link with pre-filled message
 */
export function getWhatsAppDirectUrl(payload: WhatsAppNotificationPayload, customPhone = ADMIN_WHATSAPP_NUMBER): string {
  const formatted = formatWhatsAppMessage(payload);
  const encoded = encodeURIComponent(formatted);
  return `https://wa.me/${customPhone}?text=${encoded}`;
}

/**
 * Trigger send directly in new window / tab
 */
export function sendWhatsAppNotification(payload: WhatsAppNotificationPayload, customPhone = ADMIN_WHATSAPP_NUMBER): void {
  const url = getWhatsAppDirectUrl(payload, customPhone);
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
