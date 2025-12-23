import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2024-04";

const SEAL_TOKEN = process.env.SEAL_API_TOKEN;
const SEAL_BASE =
  "https://app.sealsubscriptions.com/shopify/merchant/api/subscriptions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    /* ---------- ORDERS (Shopify Admin API) ---------- */
    const orderResp = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/orders.json?email=${encodeURIComponent(
        email
      )}&status=any`,
      {
        headers: {
          "X-Shopify-Access-Token": ADMIN_TOKEN!,
          "Content-Type": "application/json",
        },
      }
    );

    const orderJson = await orderResp.json();
    const orders =
      orderJson.orders?.map((o: any) => ({
        id: o.name,
        date: o.created_at.split("T")[0],
        status: o.fulfillment_status || "unfulfilled",
        total: Number(o.total_price),
        items: o.line_items.map((li: any) => ({
          title: li.title,
          qty: li.quantity,
        })),
        shippingAddress: o.shipping_address && {
          name: o.shipping_address.name,
          line1: o.shipping_address.address1,
          line2: o.shipping_address.address2,
          city: o.shipping_address.city,
          state: o.shipping_address.province,
          zip: o.shipping_address.zip,
          country: o.shipping_address.country,
        },
      })) || [];

    /* ---------- SUBSCRIPTIONS (Seal) ---------- */
    let subscriptions: any[] = [];

    if (SEAL_TOKEN) {
      const subResp = await fetch(
        `${SEAL_BASE}?active-only=true&with-items=true`,
        {
          headers: {
            "X-Seal-Token": SEAL_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      if (subResp.ok) {
        const data = await subResp.json();
        console.log("SEAL RAW SUBS:", JSON.stringify(data, null, 2));
        const raw = data.payload || data.subscriptions || data.data || [];

        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.subscriptions)
          ? raw.subscriptions
          : [];

        subscriptions = list;
        const shopifyCustomerId = req.query.customerId as string;

        subscriptions = list
          .filter(
            (s: any) =>
              String(s.email || "").toLowerCase() === email.toLowerCase()
          )

          .map((s: any) => {
            const item0 =
              s.items?.[0] ||
              s.subscription_items?.[0] ||
              s.order_items?.[0] ||
              null;

            const addr =
              s.shipping_address ||
              s.shippingAddress ||
              s.address ||
              s.customer_address ||
              null;

            return {
              id: String(s.id),
              product:
                item0?.product_title ||
                item0?.title ||
                item0?.product_name ||
                s.product_title ||
                "Subscription",
              nextCharge:
                s.next_order_date ||
                s.nextOrderDate ||
                s.next_billing_date ||
                s.next_charge_date ||
                s.next_delivery_date ||
                s.nextDeliveryDate ||
                null,
              nextInDays:
                s.next_order_in_days ??
                s.nextOrderInDays ??
                s.next_order_in ??
                null,
              frequency:
                s.interval ||
                s.interval_frequency ||
                s.delivery_interval ||
                s.frequency ||
                null,
              status: s.status || s.subscription_status || "active",
              shippingAddress: addr
                ? {
                    name:
                      addr.name ||
                      [addr.first_name, addr.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      null,
                    line1: addr.address1 || addr.line1 || null,
                    line2: addr.address2 || addr.line2 || null,
                    city: addr.city || null,
                    state: addr.province || addr.state || null,
                    zip: addr.zip || addr.postal_code || null,
                    country: addr.country || addr.country_code || null,
                  }
                : null,
            };
          });
      }
    }

    /* ---------- RESPONSE ---------- */
    res.status(200).json({
      orders,
      subscriptions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Account load failed" });
  }
}
