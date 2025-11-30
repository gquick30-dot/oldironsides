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

    // Just pull all active subs with items – no query filter.
    const url = SEAL_BASE + "?active-only=true&with-items=true";

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
    console.log("[Seal] raw subscriptions response:", JSON.stringify(data));

    // We know from your logs that Seal returns:
    // { success: true, payload: { subscriptions: [...] } }
    const rawList: any[] =
      data?.payload && Array.isArray(data.payload.subscriptions)
        ? data.payload.subscriptions
        : [];

    console.log("[Seal] mapped subscriptions count:", rawList.length);

    const subs = rawList.map((s: any) => ({
      id: s.id,
      status: s.status,
      email: s.email || s.customer_email,

      subscription_name:
        s.subscription_name || s.rule_name || s.product_title || s.title,
      rule_name: s.rule_name,

      next_billing:
        s.next_billing ||
        s.next_payment_date ||
        s.next_order_date ||
        s.order_placed ||
        null,

      delivery_interval: s.delivery_interval,
      billing_interval: s.billing_interval,

      items: Array.isArray(s.items)
        ? s.items.map((it: any) => ({
            id: it.id,
            title: it.title || it.product_title,
            quantity: it.quantity,
            price: it.price,
          }))
        : [],
    }));

    // No filtering by email for now – we just return what Seal gave us.
    res.status(200).json({ subscriptions: subs });
  } catch (err) {
    console.error("Seal /subscriptions handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
