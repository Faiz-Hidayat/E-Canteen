import "server-only";
import Midtrans from "midtrans-client";

/**
 * Midtrans Snap client — server-only.
 * NEVER import this from client components.
 */
export const snap = new Midtrans.Snap({
  isProduction: process.env.NODE_ENV === "production",
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
});

// ── Universal Snap helper ──────────────────────────────────
// Uses direct API call so we can set X-Override-Notification header
// and callbacks per-transaction. All URLs derived from APP_URL env var.

const SNAP_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

interface SnapTransactionParams {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  /** Finish redirect path (default: /orders) */
  finishPath?: string;
  /** Unfinish redirect path (default: /cart) */
  unfinishPath?: string;
  /** Error redirect path (default: /cart) */
  errorPath?: string;
  /** Extra Snap params (expiry, customer_details, etc.) */
  [key: string]: unknown;
}

interface SnapTransactionResult {
  token: string;
  redirect_url: string;
}

/**
 * Create a Midtrans Snap transaction with per-transaction URL overrides.
 *
 * - Webhook notification URL → `APP_URL/api/webhooks/midtrans`
 *   (via `X-Override-Notification` header — no need to update Midtrans Dashboard)
 * - Redirect callbacks (finish/unfinish/error) → derived from `APP_URL` + paths
 *
 * This means you only need to update `APP_URL` in `.env` when your tunnel changes.
 * The Midtrans Dashboard notification URLs become irrelevant.
 */
export async function createSnapTransaction(
  params: SnapTransactionParams
): Promise<SnapTransactionResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  // Derive URLs from APP_URL
  const notificationUrl = `${appUrl}/api/webhooks/midtrans`;
  const finishUrl = `${appUrl}${params.finishPath ?? "/orders"}`;
  const unfinishUrl = `${appUrl}${params.unfinishPath ?? "/cart"}`;
  const errorUrl = `${appUrl}${params.errorPath ?? "/cart"}`;

  // Build request body (strip our custom path fields)
  const { finishPath, unfinishPath, errorPath, ...rest } = params;
  const body = {
    ...rest,
    callbacks: {
      finish: finishUrl,
      unfinish: unfinishUrl,
      error: errorUrl,
    },
  };

  const response = await fetch(SNAP_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      // Basic Auth: base64(SERVER_KEY + ":")
      Authorization: `Basic ${Buffer.from(serverKey + ":").toString("base64")}`,
      // Override webhook notification URL per-transaction
      "X-Override-Notification": notificationUrl,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[createSnapTransaction] Midtrans API error:", {
      status: response.status,
      body: errorBody,
    });
    throw new Error(`Midtrans Snap API error: ${response.status}`);
  }

  const data = (await response.json()) as SnapTransactionResult;
  return data;
}
