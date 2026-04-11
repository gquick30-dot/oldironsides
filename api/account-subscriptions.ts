import type { VercelRequest, VercelResponse } from "@vercel/node";

const SEAL_TOKEN = process.env.SEAL_API_TOKEN;
const SEAL_BASE =
  "https://app.sealsubscriptions.com/shopify/merchant/api/subscriptions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

    if (!email || !password) {
      res.status(400).json({ error: "Missing email or password." });
      return;
    }

    // --- Default user shape ---
    let defaultAddress: any = null;
    let name: string = email;

    // --- If we have Seal, try to pull address from the subscription ---
    if (SEAL_TOKEN) {
      try {
        const url = `${SEAL_BASE}?active-only=true&with-items=true`;

        const r = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Seal-Token": SEAL_TOKEN,
          },
        });

        if (r.ok) {
          const data = await r.json();
          console.log(
            "[account-login] Seal raw response:",
            JSON.stringify(data)
          );

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

          const match = rawList.find((s: any) => {
            const e = String(s.email || s.customer_email || "").toLowerCase();
            return e === email.toLowerCase();
          });

          if (match) {
            // Try to build name
            const firstName = match.first_name || match.customer_first_name;
            const lastName = match.last_name || match.customer_last_name;
            if (firstName || lastName) {
              name = [firstName, lastName].filter(Boolean).join(" ");
            }

            const addr =
              match.shipping_address ||
              match.shippingAddress ||
              match.address ||
              match.customer_address ||
              null;

            if (addr) {
              defaultAddress = {
                name:
                  addr.name ||
                  [addr.first_name, addr.last_name].filter(Boolean).join(" ") ||
                  name,
                line1: addr.address1 || addr.line1 || "",
                line2: addr.address2 || addr.line2 || "",
                city: addr.city || "",
                state: addr.province || addr.state || "",
                zip: addr.zip || addr.postal_code || "",
                country: addr.country || addr.country_code || "",
              };
            }
          }
        } else {
          const text = await r.text();
          console.error("[account-login] Seal error:", r.status, text);
        }
      } catch (sealErr) {
        console.error("[account-login] Seal lookup failed:", sealErr);
      }
    } else {
      console.warn(
        "[account-login] SEAL_API_TOKEN missing, skipping Seal lookup"
      );
    }

    // --- Build user object expected by frontend ---
    const user = {
      id: email,
      email,
      name,
      defaultAddress,
    };

    // Frontend expects { accessToken, user }
    res.status(200).json({
      accessToken: "mock_access_token",
      user,
    });
  } catch (err) {
    console.error("account-login handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
