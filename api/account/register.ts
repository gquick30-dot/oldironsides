import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.VITE_SHOPIFY_API_VERSION || "2024-04";
const STOREFRONT_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const STOREFRONT_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

const CUSTOMER_CREATE_MUTATION = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer {
        id
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

  if (!STOREFRONT_URL || !STOREFRONT_TOKEN) {
    return res
      .status(500)
      .json({ error: "Missing Shopify storefront env vars on server." });
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

    const createResp = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: CUSTOMER_CREATE_MUTATION,
        variables: {
          input: {
            email,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          },
        },
      }),
    });

    const createJson = await createResp.json();
    const result = createJson?.data?.customerCreate;
    const errors = result?.customerUserErrors ?? [];

    if (errors.length) {
      return res.status(400).json({
        error: errors[0]?.message || "Registration failed.",
      });
    }

    // ✅ Shopify sends activation email automatically
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("account-register error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
