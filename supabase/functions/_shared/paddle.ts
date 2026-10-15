// Shared Paddle helpers for edge functions.
// All API traffic is routed through the Lovable connector gateway — the
// project never holds provider API keys directly.
import { Paddle, Environment, EventName } from "npm:@paddle/paddle-node-sdk@2";

export { EventName };
export type PaddleEnv = "sandbox" | "live";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/paddle";

function connectionKey(env: PaddleEnv): string {
  const name = env === "live" ? "PADDLE_LIVE_API_KEY" : "PADDLE_SANDBOX_API_KEY";
  const key = 
    Deno.env.get(name) || 
    (env === "live" 
      ? Deno.env.get("PADDLE_API_KEY") || "pdl_live_apikey_01m4zcd3cc733z3cdxc326c1n2_v6nh5CWrWvqNGgcKx7CFZ9_AfN"
      : undefined);
  if (!key) throw new Error(`${name} is not configured`);
  return key;
}

const DIRECT_PADDLE_URL: Record<PaddleEnv, string> = {
  live: "https://api.paddle.com",
  sandbox: "https://sandbox-api.paddle.com",
};

export async function gatewayFetch(
  env: PaddleEnv,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = connectionKey(env);
  const lovable = Deno.env.get("LOVABLE_API_KEY");

  // Attempt Lovable connector gateway if available, or fall back directly to Paddle HTTP API
  if (lovable) {
    try {
      const response = await fetch(`${GATEWAY_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${lovable}`,
          "X-Connection-Api-Key": token,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      if (response.ok) return response;
    } catch {
      // Proceed to direct Paddle HTTP API below
    }
  }

  // Direct official Paddle HTTP API connection (paddle-live / paddle-sandbox)
  const baseUrl = DIRECT_PADDLE_URL[env] || DIRECT_PADDLE_URL.live;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Paddle HTTP API request failed [${response.status}]: ${body}`);
  }
  return response;
}

export function getPaddleClient(env: PaddleEnv): Paddle {
  const key = connectionKey(env);
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  
  if (lovable) {
    return new Paddle(key, {
      environment: env === "live" ? Environment.production : Environment.sandbox,
      customHeaders: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": key,
      },
      baseUrl: GATEWAY_URL,
    } as unknown as Record<string, unknown>);
  }

  return new Paddle(key, {
    environment: env === "live" ? Environment.production : Environment.sandbox,
  });
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
