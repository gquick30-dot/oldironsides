import type { VercelRequest, VercelResponse } from "@vercel/node";

const PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY; // server-only
const PROMO_LIST_ID = process.env.KLAVIYO_LIST_ID; // existing promo list
const LAUNCH_LIST_ID = process.env.KLAVIYO_LAUNCH_LIST_ID; // new launch notify list

function emailOk(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val || "").trim());
}

function pickListId(source: string) {
  const s = String(source || "").trim();
  if (s === "soft-launch-notify") return LAUNCH_LIST_ID;
  // default everything else to promo list
  return PROMO_LIST_ID;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!PRIVATE_KEY || !PROMO_LIST_ID) {
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

    const LIST_ID = pickListId(source);

    // If they hit soft-launch-notify but you forgot to set the launch list env var, fail loudly.
    if (source === "soft-launch-notify" && !LIST_ID) {
      res.status(500).json({ error: "Launch list env missing" });
      return;
    }

    if (!LIST_ID) {
      res.status(500).json({ error: "Klaviyo list env missing" });
      return;
    }

    // 1) Create profile (or 409 if already exists)
    const profileResp = await fetch("https://a.klaviyo.com/api/profiles/", {
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
              capture:
                source === "soft-launch-notify" ? "launch-notify" : "promo",
            },
          },
        },
      }),
    });

    if (!profileResp.ok && profileResp.status !== 409) {
      const t = await profileResp.text();
      res.status(502).json({ error: "Klaviyo profile failed", detail: t });
      return;
    }

    // 2) Get profile ID
    let profileId: string | null = null;

    if (profileResp.status === 200) {
      const json = await profileResp.json();
      profileId = json?.data?.id || null;
    } else {
      const lookup = await fetch(
        `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${email}")`,
        {
          headers: {
            Authorization: `Klaviyo-API-Key ${PRIVATE_KEY}`,
            Accept: "application/json",
            Revision: "2024-10-15",
          },
        }
      );

      if (lookup.ok) {
        const json = await lookup.json();
        profileId = json?.data?.[0]?.id || null;
      }
    }

    if (!profileId) {
      res.status(502).json({ error: "Klaviyo profile ID not found" });
      return;
    }

    // 3) Subscribe to the right list
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
          data: [{ type: "profile", id: profileId }],
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

    res
      .status(200)
      .json({
        ok: true,
        list: source === "soft-launch-notify" ? "launch" : "promo",
      });
  } catch {
    res.status(500).json({ error: "Unexpected server error" });
  }
}
