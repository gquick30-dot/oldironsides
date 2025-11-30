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

    // Seal can return either an array or { payload: [...] }
    const rawList: any[] = Array.isArray(data)
      ? data
      : Array.isArray((data as any).payload)
      ? (data as any).payload
      : [];

    const subs = rawList.map((s) => ({
      id: s.id,
      status: s.status,
      email: s.email,
      firstName: s.first_name,
      lastName: s.last_name,
      nextOrderAt: s.next_order_date || s.order_placed || null,
      deliveryInterval: s.delivery_interval,
      billingInterval: s.billing_interval,
      totalValue: s.total_value,
      items: Array.isArray(s.items)
        ? s.items.map((it: any) => ({
            id: it.id,
            title: it.title,
            quantity: it.quantity,
            price: it.price,
          }))
        : [],
    }));

    // Match what the frontend expects
    res.status(200).json({ subscriptions: subs });
  } catch (err) {
    console.error("Seal /subscriptions handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
