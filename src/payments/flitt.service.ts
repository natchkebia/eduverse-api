import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/** Raised when Flitt rejects a request or is unreachable. */
export class FlittError extends Error {
  constructor(
    message: string,
    readonly code?: number,
  ) {
    super(message);
    this.name = 'FlittError';
  }
}

/**
 * Flitt (ex-Fondy) payment gateway client.
 *
 * Docs: https://docs.flitt.com — the API is Fondy-compatible.
 * Signature algorithm (both request and callback):
 *   1. drop `signature` / `response_signature_string` and empty values
 *   2. sort remaining params by key
 *   3. join values with "|", prefixed by the secret key
 *   4. sha1 hex
 */
@Injectable()
export class FlittService {
  private readonly logger = new Logger(FlittService.name);

  constructor(private readonly config: ConfigService) {}

  private get merchantId(): string {
    return this.config.getOrThrow<string>('FLITT_MERCHANT_ID');
  }

  private get secretKey(): string {
    return this.config.getOrThrow<string>('FLITT_SECRET_KEY');
  }

  private get apiUrl(): string {
    return this.config.get<string>('FLITT_API_URL', 'https://pay.flitt.com/api');
  }

  /** Build the Fondy/Flitt signature over the given params. */
  signature(params: Record<string, unknown>): string {
    const filtered = Object.entries(params)
      .filter(
        ([key, value]) =>
          key !== 'signature' &&
          key !== 'response_signature_string' &&
          value !== '' &&
          value !== null &&
          value !== undefined,
      )
      .sort(([a], [b]) => a.localeCompare(b));

    const payload = [
      this.secretKey,
      ...filtered.map(([, value]) => String(value)),
    ].join('|');

    return crypto.createHash('sha1').update(payload).digest('hex');
  }

  /**
   * Create a hosted-checkout session and return the redirect URL.
   * @param amount minor units (tetri) — integer
   */
  async createCheckout(input: {
    orderId: string;
    amount: number;
    currency: string;
    description: string;
    callbackUrl: string;
    responseUrl: string;
    lang?: string;
  }): Promise<string> {
    const request: Record<string, unknown> = {
      order_id: input.orderId,
      merchant_id: this.merchantId,
      order_desc: input.description,
      amount: input.amount,
      currency: input.currency,
      server_callback_url: input.callbackUrl,
      response_url: input.responseUrl,
      lang: input.lang ?? 'ka',
    };
    request.signature = this.signature(request);

    let json: {
      response?: {
        response_status?: string;
        checkout_url?: string;
        error_message?: string;
        error_code?: number;
      };
    };
    try {
      const res = await fetch(`${this.apiUrl}/checkout/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });
      json = await res.json();
    } catch (e) {
      this.logger.error(`Flitt request failed: ${(e as Error).message}`);
      throw new FlittError('გადახდის სერვისთან დაკავშირება ვერ მოხერხდა');
    }

    const response = json.response;
    if (
      !response ||
      response.response_status !== 'success' ||
      !response.checkout_url
    ) {
      this.logger.error(
        `Flitt checkout rejected: ${response?.error_code} ${response?.error_message}`,
      );
      throw new FlittError(
        response?.error_message ?? 'Flitt checkout failed',
        response?.error_code,
      );
    }

    return response.checkout_url;
  }

  /** Verify a server callback signature; returns true when authentic. */
  verifyCallback(body: Record<string, unknown>): boolean {
    const received = body.signature;
    if (typeof received !== 'string') return false;

    const expected = this.signature(body);
    // constant-time compare
    const a = Buffer.from(expected);
    const b = Buffer.from(received);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
