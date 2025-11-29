// api/submit-review.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const JUDGEME_BASE = "https://judge.me/api/v1";

function getExternalId(shopifyProductId: string): string {
  // Strip Shopify gid → get numeric ID
  if (shopifyProductId.startsWith("gid://")) {
    const parts = shopifyProductId.split("/");
    return parts[parts.length - 1];
  }
  return shopifyProductId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiToken = process.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = process.env.JUDGEME_SHOP_DOMAIN;

  if (!apiToken || !shopDomain) {
    return res.status(500).json({ error: "Judge.me env vars missing" });
  }

  const { shopifyProductId, rating, title, body, reviewerName, reviewerEmail } =
    req.body as {
      shopifyProductId?: string;
      rating?: number;
      title?: string;
      body?: string;
      reviewerName?: string;
      reviewerEmail?: string;
    };

  if (!shopifyProductId || !rating || !reviewerName || !reviewerEmail) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const externalId = getExternalId(shopifyProductId);

    // 1) Get Judge.me internal product_id from Shopify product ID
    const productUrl = new URL(`${JUDGEME_BASE}/products/-1`);
    productUrl.searchParams.set("shop_domain", shopDomain);
    productUrl.searchParams.set("api_token", apiToken);
    productUrl.searchParams.set("external_id", externalId);

    const productResp = await fetch(productUrl.toString());
    const productJson = await productResp.json();

    const judgeProductId = productJson?.product?.id;
    if (!judgeProductId) {
      return res
        .status(400)
        .json({ error: "Unable to resolve Judge.me product id" });
    }

    // 2) Create the review
    const form = new URLSearchParams();
    form.set("api_token", apiToken);
    form.set("shop_domain", shopDomain);
    form.set("product_id", String(judgeProductId));
    form.set("reviewer_name", reviewerName);
    form.set("reviewer_email", reviewerEmail);
    form.set("rating", String(rating));
    if (title) form.set("title", title);
    if (body) form.set("body", body);
    form.set("review_source", "oldironsidescoffee.com");

    const reviewResp = await fetch(`${JUDGEME_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const reviewJson = await reviewResp.json();

    if (!reviewResp.ok) {
      return res
        .status(reviewResp.status)
        .json({ error: "Judge.me error", details: reviewJson });
    }

    return res.status(200).json({ ok: true, review: reviewJson });
  } catch (err: any) {
    console.error("Judge.me submit error", err);
    return res.status(500).json({ error: "Server error" });
  }
}
