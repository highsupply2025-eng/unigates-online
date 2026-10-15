/**
 * UNIGATES Production Paddle Live HTTP Client & Agent Bridge
 *
 * Connects directly to the 'paddle-live' production environment via HTTP
 * using active OAuth / API key credentials and references Paddle MCP server settings
 * for transaction processing on the published domain (https://unigates.online).
 */

export interface PaddleLiveConfig {
  apiUrl: string;
  mcpServerUrl: string;
  environment: "live" | "sandbox";
  apiKey: string;
  clientToken: string;
  publishedDomain: string;
}

export const PADDLE_LIVE_CONFIG: PaddleLiveConfig = {
  apiUrl: "https://api.paddle.com",
  mcpServerUrl: "https://mcp.paddle.com/mcp",
  environment: "live",
  apiKey:
    (import.meta.env.VITE_PADDLE_API_KEY as string | undefined) ||
    "pdl_live_apikey_01m4zcd3cc733z3cdxc326c1n2_v6nh5CWrWvqNGgcKx7CFZ9_AfN",
  clientToken:
    (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) ||
    (import.meta.env.PADDLE_CLIENT_TOKEN as string | undefined) ||
    "live_ed63bc96090a362134c6242a552",
  publishedDomain:
    (import.meta.env.VITE_PUBLISHED_DOMAIN as string | undefined) ||
    "https://unigates.online",
};

export class PaddleLiveClient {
  private static config: PaddleLiveConfig = PADDLE_LIVE_CONFIG;

  /**
   * Health-check: verify connectivity to the official Paddle Live production HTTP endpoints.
   */
  public static async testLiveConnectivity(): Promise<{
    ok: boolean;
    status: number;
    latencyMs: number;
    endpoint: string;
    domain: string;
  }> {
    const startTime = performance.now();
    try {
      // Query Paddle's public IP list or prices endpoint as ping
      const res = await fetch("https://api.paddle.com/ips", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        ok: res.ok,
        status: res.status,
        latencyMs,
        endpoint: this.config.apiUrl,
        domain: this.config.publishedDomain,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      console.warn("[PaddleLiveClient] Connectivity check notice:", err);
      return {
        ok: false,
        status: 0,
        latencyMs,
        endpoint: this.config.apiUrl,
        domain: this.config.publishedDomain,
      };
    }
  }

  /**
   * Get active MCP server connection configuration for agents.
   */
  public static getMcpServerReference() {
    return {
      serverName: "paddle-live",
      type: "http",
      url: this.config.mcpServerUrl,
      apiUrl: this.config.apiUrl,
      environment: this.config.environment,
      publishedDomain: this.config.publishedDomain,
      authHeader: `Bearer ${this.config.apiKey}`,
      clientToken: this.config.clientToken,
    };
  }

  /**
   * Generate customer portal URL for an authenticated customer on the published domain.
   */
  public static buildCustomerPortalDeepLink(customerId: string): string {
    return `${this.config.publishedDomain}/account?tab=billing&customer_id=${encodeURIComponent(customerId)}`;
  }

  /**
   * Returns whether the client is currently in live production mode.
   */
  public static isLiveProduction(): boolean {
    return this.config.environment === "live" && !this.config.clientToken.startsWith("test_");
  }
}
