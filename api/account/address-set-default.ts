import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.VITE_SHOPIFY_API_VERSION || "2024-04";
const STOREFRONT_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const STOREFRONT_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

const MUTATION = `
  mutation customerDefaultAddressUpdate(
    $customerAccessToken: String!
    $addressId: ID!
  ) {
    customerDefaultAddressUpdate(
      customerAccessToken: $customerAccessToken
      addressId: $addressId
    ) {
      customer {
        id
        defaultAddress {
          id
        }
      }
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

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const addressId = body?.addressId;

    if (!addressId) {
      return res.status(400).json({ error: "Missing addressId" });
    }

    const r = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN!,
      },
      body: JSON.stringify({
        query: MUTATION,
        variables: {
          customerAccessToken: token,
          addressId,
        },
      }),
    });

    const json = await r.json();
    const result = json?.data?.customerDefaultAddressUpdate;
    const errs = result?.customerUserErrors || [];

    if (errs.length) {
      return res.status(400).json({ error: errs[0].message, debug: json });
    }

    return res
      .status(200)
      .json({ defaultId: result.customer.defaultAddress.id });
  } catch (err) {
    console.error("address-set-default error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
