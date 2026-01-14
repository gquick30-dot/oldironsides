const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.VITE_SHOPIFY_API_VERSION || "2024-04";
const STOREFRONT_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const STOREFRONT_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;
const QUERY = `
  query customerAddresses($accessToken: String!) {
    customer(customerAccessToken: $accessToken) {
      id
      defaultAddress {
        id
      }
      addresses(first: 25) {
        edges {
          node {
            id
            name
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
      }
    }
  }
`;
export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
    }
    if (!STOREFRONT_URL || !STOREFRONT_TOKEN) {
        return res
            .status(500)
            .json({ error: "Missing Shopify storefront env vars on server." });
    }
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const r = await fetch(STOREFRONT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
            },
            body: JSON.stringify({
                query: QUERY,
                variables: { accessToken: token },
            }),
        });
        const json = await r.json();
        const cust = json?.data?.customer;
        if (!cust) {
            return res
                .status(401)
                .json({ error: "Invalid customer session.", debug: json });
        }
        const defaultId = cust?.defaultAddress?.id || null;
        const addresses = cust?.addresses?.edges?.map((e) => e?.node).filter(Boolean) || [];
        return res.status(200).json({ defaultId, addresses });
    }
    catch (err) {
        console.error("addresses handler error:", err);
        return res.status(500).json({ error: "Unexpected server error." });
    }
}
