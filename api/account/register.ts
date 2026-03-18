import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = "2023-10";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
    return res
      .status(500)
      .json({ error: "Missing Shopify admin env vars on server." });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();

    if (!name || !email) {
      return res.status(400).json({ error: "Missing name or email." });
    }

    const [firstName, ...rest] = name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    const r = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/customers.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_TOKEN,
        },
        body: JSON.stringify({
          customer: {
            email,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            accepts_marketing: true,
            tags: "promo_20_modal",
            marketing_opt_in_level: "single_opt_in",
            send_email_invite: true,
          },
        }),
      }
    );

    const data = await r.json();

    // customer already exists
    if (!r.ok) {
      if (r.status === 422) {
        const searchRes = await fetch(
          `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
            email
          )}`,
          {
            headers: {
              "X-Shopify-Access-Token": ADMIN_TOKEN,
            },
          }
        );

        const searchData = await searchRes.json();
        const customer = searchData.customers?.[0];

        if (!customer?.id) {
          return res
            .status(400)
            .json({ error: "Customer exists but not found." });
        }

        await fetch(
          `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/customers/${customer.id}/send_invite.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": ADMIN_TOKEN,
            },
          }
        );

        return res.status(200).json({ ok: true, invited_existing: true });
      }
      return res.status(400).json({ error: data });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("account-register error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Unexpected server error." });
  }
}
