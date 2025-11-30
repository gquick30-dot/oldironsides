// api/account-subscriptions.ts
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
    const email = String(body.email || "").trim();

    if (!email) {
      res.status(400).json({ error: "Missing email." });
      return;
    }

    // Pull all active subs, filter by email in code
    const url = `${SEAL_BASE}?active-only=true&with-items=true`;

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
    console.log(
      "[Seal] raw subscriptions response:",
      JSON.stringify(data, null, 2)
    );

    // Handle Seal shapes: [], { payload: [...] }, { subscriptions: [...] }, { data: [...] }
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

    // Filter by email
    const filtered = rawList.filter((s: any) => {
      const e = String(s.email || s.customer_email || "").toLowerCase();
      return e === email.toLowerCase();
    });

    const source = filtered.length > 0 ? filtered : rawList;

    const subs = source.map((s: any) => {
      const addr =
        s.shipping_address ||
        s.shippingAddress ||
        s.address ||
        s.customer_address ||
        null;

      const shippingAddress = addr
        ? {
            name:
              addr.name ||
              [addr.first_name, addr.last_name].filter(Boolean).join(" ") ||
              "",
            line1: addr.address1 || addr.line1 || "",
            line2: addr.address2 || addr.line2 || "",
            city: addr.city || "",
            state: addr.province || addr.state || "",
            zip: addr.zip || addr.postal_code || "",
            country: addr.country || addr.country_code || "",
          }
        : null;

      return {
        id: s.id,
        status: s.status,
        email: s.email || s.customer_email,
        firstName: s.first_name,
        lastName: s.last_name,

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

        totalValue: s.total_value,
        items: Array.isArray(s.items)
          ? s.items.map((it: any) => ({
              id: it.id,
              title: it.title || it.product_title,
              quantity: it.quantity,
              price: it.price,
            }))
          : [],

        // NEW: normalized shipping address from Seal
        shippingAddress,
      };
    });

    res.status(200).json({ subscriptions: subs });
  } catch (err) {
    console.error("Seal /subscriptions handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
