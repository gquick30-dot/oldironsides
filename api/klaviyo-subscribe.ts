import type { VercelRequest, VercelResponse } from "@vercel/node";

const PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY; // server-only
const LIST_ID = process.env.KLAVIYO_LIST_ID; // server-only

function emailOk(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!PRIVATE_KEY || !LIST_ID) {
    res.status(500).json({ error: "Klaviyo env missing" });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || "").trim();
    const source = String(body.source || "site").trim();

    if (!emailOk(email)) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    // Create profile (Klaviyo API v2024-xx style)
    const createProfile = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${PRIVATE_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        Revision: "2024-10-15",
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            properties: {
              source,
              capture: "promo",
            },
          },
        },
      }),
    });

    // 409 means profile exists, still OK
    if (!createProfile.ok && createProfile.status !== 409) {
      const t = await createProfile.text();
      res.status(502).json({ error: "Klaviyo profile failed", detail: t });
      return;
    }

    // Subscribe profile to list (correct relationship payload)
    const sub = await fetch(
      `https://a.klaviyo.com/api/lists/${LIST_ID}/relationships/profiles/`,
      {
        method: "POST",
        headers: {
          Authorization: `Klaviyo-API-Key ${PRIVATE_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          Revision: "2024-10-15",
        },
        body: JSON.stringify({
          data: [
            {
              type: "profile",
              meta: {
                identifiers: {
                  email,
                },
              },
            },
          ],
        }),
      }
    );

    if (!sub.ok && sub.status !== 409) {
      const t = await sub.text();
      res
        .status(502)
        .json({ error: "Klaviyo list subscribe failed", detail: t });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Unexpected server error" });
  }
}
