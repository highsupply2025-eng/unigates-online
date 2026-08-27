// Shared Paddle helpers for edge functions.
// All API traffic is routed through the Lovable connector gateway — the
// project never holds provider API keys directly.
import { Paddle, Environment, EventName } from "npm:@paddle/paddle-node-sdk@2";

export { EventName };
export type PaddleEnv = "sandbox" | "live";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/paddle";

function connectionKey(env: PaddleEnv): string {
  const name = env === "live" ? "PADDLE_LIVE_API_KEY" : "PADDLE_SANDBOX_API_KEY";
  const key = Deno.env.get(name);
  if (!key) throw new Error(`${name} is not configured`);
  return key;
}

function lovableKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export async function gatewayFetch(
  env: PaddleEnv,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey()}`,
      "X-Connection-Api-Key": connectionKey(env),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paddle gateway request failed [${response.status}]: ${body}`);
  }
  return response;
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  return new Paddle(connectionKey(env), {
    environment: env === "live" ? Environment.production : Environment.sandbox,
    customHeaders: {
      Authorization: `Bearer ${lovableKey()}`,
      "X-Connection-Api-Key": connectionKey(env),
    },
    baseUrl: GATEWAY_URL,
  } as unknown as Record<string, unknown>);
}

export async function verifyWebhook(req: Request, env: PaddleEnv) {
  const secretName = env === "live"
    ? "PAYMENTS_LIVE_WEBHOOK_SECRET"
    : "PAYMENTS_SANDBOX_WEBHOOK_SECRET";
  const secret = Deno.env.get(secretName);
  if (!secret) throw new Error(`${secretName} is not configured`);

  const signature = req.headers.get("paddle-signature");
  if (!signature) throw new Error("Missing paddle-signature header");

  const rawBody = await req.text();
  const paddle = new Paddle(connectionKey(env), {
    environment: env === "live" ? Environment.production : Environment.sandbox,
  });
  const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
  if (!event) throw new Error("Failed to verify webhook signature");
  return event;
}
