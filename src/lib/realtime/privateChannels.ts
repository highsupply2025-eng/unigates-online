import { supabase } from "@/integrations/supabase/client";

/**
 * Private realtime topic helpers.
 *
 * Sensitive 1:1 signaling (WebRTC offers/answers/ICE, typing indicators,
 * incoming-call notifications) must never travel on a shared topic that both
 * parties (and anyone able to guess their user IDs) can subscribe to.
 *
 * Instead every user has their own inbox topic that starts with
 * `private-<their-uid>` so the realtime.messages RLS policy
 * ("Strict per-user channel subscription") only lets that exact user
 * subscribe to it. Senders publish into the recipient's inbox without
 * subscribing to it (broadcast-only), which is allowed by the insert policy.
 */

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * Every topic is `private-<recipient>-...-from-<sender>` so that both the
 * subscribe policy (topic must start with the subscriber's own id) and the
 * publish policy (topic must end with the publisher's own id) can verify
 * ownership. Nobody can spoof a message as another user.
 */

/** Inbox topic for `recipientId` for a 1:1 call signaling room. */
export function callInboxTopic(recipientId: string, institutionId: string, peerId: string) {
  return `private-${sanitize(recipientId)}-call-${sanitize(institutionId)}-from-${sanitize(peerId)}`;
}

/** Inbox topic for `recipientId` for chat presence/typing signals. */
export function chatInboxTopic(recipientId: string, institutionId: string, peerId: string) {
  return `private-${sanitize(recipientId)}-chat-${sanitize(institutionId)}-from-${sanitize(peerId)}`;
}

/** Inbox topic for `recipientId` for incoming-call notifications from `peerId`. */
export function callsHubInboxTopic(recipientId: string, institutionId: string, peerId: string) {
  return `private-${sanitize(recipientId)}-calls-hub-${sanitize(institutionId)}-from-${sanitize(peerId)}`;
}

/** Subscribe-capable private channel (only valid for the current user's own inbox). */
export function privateChannel(topic: string) {
  return supabase.channel(topic, { config: { private: true } });
}

/**
 * Publish a broadcast event into another user's private inbox topic without
 * subscribing to it (so the sender can never read that user's inbox).
 */
export async function sendToPrivateInbox(topic: string, event: string, payload: unknown) {
  const channel = supabase.channel(topic, { config: { private: true } });
  try {
    await channel.send({ type: "broadcast", event, payload });
  } finally {
    await supabase.removeChannel(channel);
  }
}
