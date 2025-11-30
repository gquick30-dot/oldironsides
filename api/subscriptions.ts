import type { VercelRequest, VercelResponse } from "@vercel/node";

const SEAL_TOKEN = process.env.SEAL_API_TOKEN;
const SEAL_BASE =
  "https://app.sealsubscriptions.com/shopify/merchant/api/subscriptions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!SEAL_TOKEN) {
    res.status(500).json({ error: "Missing SEAL_API_TOKEN on server." });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { email } = body;

    if (!email) {
      res.status(400).json({ error: "Missing email." });
      return;
    }

    const url =
      SEAL_BASE +
      `?query=${encodeURIComponent(email)}&active-only=true&with-items=true`;

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Seal-Token": SEAL_TOKEN,
      },
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("Seal /subscriptions error:", r.status, text);
      res
        .status(502)
        .json({ error: "Failed to load subscriptions from Seal." });
      return;
    }
    const data = await r.json();

    // Log raw Seal response so you can see the exact shape in Vercel logs
    console.log("[Seal] raw subscriptions response:", JSON.stringify(data));

    // Handle common Seal shapes: [], { payload: [...] }, { subscriptions: [...] }, { data: [...] }
    let rawList: any[] = [];

    if (Array.isArray(data)) {
      rawList = data;
    } else if (Array.isArray((data as any).payload)) {
      rawList = (data as any).payload;
    } else if (Array.isArray((data as any).subscriptions)) {
      rawList = (data as any).subscriptions;
    } else if (Array.isArray((data as any).data)) {
      rawList = (data as any).data;
    }

    const subs = rawList.map((s: any) => ({
      // base identifiers
      id: s.id,
      status: s.status,
      email: s.email || s.customer_email,
      firstName: s.first_name,
      lastName: s.last_name,

      // names the frontend already looks for
      subscription_name:
        s.subscription_name || s.rule_name || s.product_title || s.title,
      rule_name: s.rule_name,

      // dates the frontend already looks for
      next_billing:
        s.next_billing ||
        s.next_payment_date ||
        s.next_order_date ||
        s.order_placed ||
        null,

      // intervals the frontend already looks for
      delivery_interval: s.delivery_interval,
      billing_interval: s.billing_interval,

      // keep some extra info too
      totalValue: s.total_value,
      items: Array.isArray(s.items)
        ? s.items.map((it: any) => ({
            id: it.id,
            title: it.title || it.product_title,
            quantity: it.quantity,
            price: it.price,
          }))
        : [],
    }));

    // Shape the frontend expects: { subscriptions: [...] }
    res.status(200).json({ subscriptions: subs });
  } catch (err) {
    console.error("Seal /subscriptions handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
