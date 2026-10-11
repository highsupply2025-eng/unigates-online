/**
 * UNIGATES Edge Serverless Global Cloud Sync Endpoint
 * ══════════════════════════════════════════════════
 * Deployed across Vercel Global Edge Network.
 * Coordinates multi-region state synchronization between visitors,
 * authors, and platform administrators worldwide.
 */

// Edge in-memory persistence for cross-device synchronization
const globalStore = {
  authors: new Map<string, any>(),
  submissions: new Map<string, any>(),
  invoices: new Map<string, any>(),
  contracts: new Map<string, any>(),
  messages: new Map<string, any[]>()
};

export default async function handler(req: any, res: any) {
  // CORS & Global Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    const action = req.query?.action || "fetch_all";

    if (action === "fetch_all") {
      return res.status(200).json({
        authors: Array.from(globalStore.authors.values()),
        submissions: Array.from(globalStore.submissions.values()),
        invoices: Array.from(globalStore.invoices.values()),
        contracts: Array.from(globalStore.contracts.values()),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "authors") {
      return res.status(200).json(Array.from(globalStore.authors.values()));
    }

    return res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
  }

  if (req.method === "POST") {
    try {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.eventType) {
        return res.status(400).json({ error: "Missing eventType in payload" });
      }

      const { eventType, entityId, data } = payload;

      switch (eventType) {
        case "AUTHOR_REGISTERED":
        case "AUTHOR_UPDATED":
        case "AUTHOR_VERIFIED":
          if (data && (data.id || entityId)) {
            const id = data.id || entityId;
            globalStore.authors.set(id, data);
          }
          break;

        case "SUBMISSION_CREATED":
        case "SUBMISSION_UPDATED":
          if (data && (data.id || entityId)) {
            const id = data.id || entityId;
            globalStore.submissions.set(id, data);
          }
          break;

        case "INVOICE_CREATED":
        case "INVOICE_UPDATED":
          if (data && (data.id || entityId)) {
            const id = data.id || entityId;
            globalStore.invoices.set(id, data);
          }
          break;

        case "CONTRACT_ISSUED":
        case "CONTRACT_SIGNED":
          if (data && (data.id || entityId)) {
            const id = data.id || entityId;
            globalStore.contracts.set(id, data);
          }
          break;

        case "CONTRACT_DELETED":
          if (entityId) {
            globalStore.contracts.delete(entityId);
          }
          break;

        case "MESSAGE_SENT":
          if (data && entityId) {
            const existing = globalStore.messages.get(entityId) || [];
            existing.push(data);
            globalStore.messages.set(entityId, existing);
          }
          break;
      }

      return res.status(200).json({
        success: true,
        eventType,
        entityId,
        receivedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[cloud-sync api] Error processing payload:", err);
      return res.status(500).json({ error: err?.message || "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
