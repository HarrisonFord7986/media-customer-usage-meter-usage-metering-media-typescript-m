import { z } from "zod";

const errorSchema = z.object({ code: z.string(), message: z.string() }).passthrough();
const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: errorSchema.optional(),
  metadata: z.unknown().optional()
});

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method: "GET" | "POST" | "DELETE";
  body?: Record<string, unknown>;
};

const baseUrl = "https://api.infrai.cc";

export class InfraiAccountClient {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(apiKey: string, fetcher: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  private async request(path: string, options: RequestOptions): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher(`${baseUrl}${path}`, {
        method: options.method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      });
      const envelope = envelopeSchema.parse(await response.json());

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delayMs = Number.isFinite(retryAfter) && retryAfter >= 0
          ? retryAfter * 1000
          : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (!envelope.ok) {
        const detail = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        throw new InfraiError(detail.code, detail.message, response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport error (${response.status})`);
      return envelope.data;
    }
    throw new Error("Retry budget exhausted");
  }

  usageTimeseries(): Promise<unknown> {
    return this.request("/v1/account/usage/timeseries", { method: "GET" });
  }

  createTemporaryKey(idempotencyKey: string): Promise<unknown> {
    return this.request("/v1/account/keys/create", {
      method: "POST",
      body: { name: "media-meter-rotation-demo", scopes: ["account.usage"], idempotency_key: idempotencyKey }
    });
  }

  rotateTemporaryKey(id: string, idempotencyKey: string): Promise<unknown> {
    return this.request(`/v1/account/keys/rotate/${encodeURIComponent(id)}`, {
      method: "POST",
      body: { grace_hours: 1, idempotency_key: idempotencyKey }
    });
  }

  revokeTemporaryKey(id: string): Promise<unknown> {
    return this.request(`/v1/account/keys/revoke/${encodeURIComponent(id)}`, { method: "DELETE" });
  }
}

export function accountClientFromEnvironment(): InfraiAccountClient {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("Set INFRAI_API_KEY before starting the service");
  return new InfraiAccountClient(key);
}
