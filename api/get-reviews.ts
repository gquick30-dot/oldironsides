// api/get-reviews.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const JUDGEME_BASE = "https://judge.me/api/v1";

function getExternalId(shopifyProductId: string): string {
  if (shopifyProductId.startsWith("gid://")) {
    const parts = shopifyProductId.split("/");
    return parts[parts.length - 1];
  }
  return shopifyProductId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiToken = process.env.JUDGEME_PRIVATE_API_TOKEN;
  const shopDomain = process.env.JUDGEME_SHOP_DOMAIN;

  if (!apiToken || !shopDomain) {
    return res.status(500).json({ error: "Judge.me env vars missing" });
  }

  const shopifyProductId = req.query.shopifyProductId as string | undefined;
  const perPage = (req.query.perPage as string | undefined) ?? "20";

  if (!shopifyProductId) {
    return res.status(400).json({ error: "shopifyProductId is required" });
  }

  try {
    const externalId = getExternalId(shopifyProductId);

    // 1) Map Shopify product → Judge.me product_id
    const productUrl = new URL(`${JUDGEME_BASE}/products/-1`);
    productUrl.searchParams.set("shop_domain", shopDomain);
    productUrl.searchParams.set("api_token", apiToken);
    productUrl.searchParams.set("external_id", externalId);

    const productResp = await fetch(productUrl.toString());
    const productJson = await productResp.json();
    const judgeProductId = productJson?.product?.id;

    if (!judgeProductId) {
      return res.status(200).json({ reviews: [] });
    }

    // 2) Fetch reviews
    const reviewsUrl = new URL(`${JUDGEME_BASE}/reviews`);
    reviewsUrl.searchParams.set("shop_domain", shopDomain);
    reviewsUrl.searchParams.set("api_token", apiToken);
    reviewsUrl.searchParams.set("product_id", String(judgeProductId));
    reviewsUrl.searchParams.set("per_page", perPage);
    reviewsUrl.searchParams.set("published", "true");

    const reviewsResp = await fetch(reviewsUrl.toString());
    const reviewsJson = await reviewsResp.json();

    // Normalize a bit
    const normalized = (reviewsJson?.reviews ?? []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      reviewer_name: r.reviewer_name,
      created_at: r.created_at,
    }));

    return res.status(200).json({ reviews: normalized });
  } catch (err: any) {
    console.error("Judge.me get-reviews error", err);
    return res.status(500).json({ error: "Server error" });
  }
}
