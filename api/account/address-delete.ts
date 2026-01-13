import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.VITE_SHOPIFY_API_VERSION || "2024-04";
const STOREFRONT_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const STOREFRONT_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

const MUTATION = `
  mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
    customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
      deletedCustomerAddressId
      customerUserErrors {
        field
        message
      }
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!STOREFRONT_URL || !STOREFRONT_TOKEN) {
    return res
      .status(500)
      .json({ error: "Missing Shopify storefront env vars on server." });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const id = String(body.id || "").trim();

    if (!id) return res.status(400).json({ error: "Missing address id" });

    const r = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: { customerAccessToken: token, id },
      }),
    });

    const json = await r.json();
    const result = json?.data?.customerAddressDelete;
    const errs = result?.customerUserErrors ?? [];

    if (errs.length) {
      return res.status(400).json({
        error: errs[0]?.message || "Delete failed.",
        debug: json,
      });
    }

    return res.status(200).json({
      deletedId: result?.deletedCustomerAddressId || id,
    });
  } catch (err) {
    console.error("address-delete error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
