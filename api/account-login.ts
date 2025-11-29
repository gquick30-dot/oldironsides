import type { VercelRequest, VercelResponse } from "@vercel/node";

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN;
const API_VERSION = process.env.VITE_SHOPIFY_API_VERSION || "2024-04";
const STOREFRONT_TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

const STOREFRONT_URL = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

const LOGIN_MUTATION = `
  mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken {
        accessToken
        expiresAt
      }
      customerUserErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_QUERY = `
  query customerQuery($accessToken: String!) {
    customer(customerAccessToken: $accessToken) {
      id
      firstName
      lastName
      email
      defaultAddress {
        id
        name
        address1
        address2
        city
        province
        zip
        country
      }
    }
  }
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!STOREFRONT_URL || !STOREFRONT_TOKEN) {
    res
      .status(500)
      .json({ error: "Missing Shopify storefront env vars on server." });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { email, password } = body;

    if (!email || !password) {
      res.status(400).json({ error: "Missing email or password." });
      return;
    }

    // 1) Login -> get customer access token
    const loginResp = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: {
          input: { email, password },
        },
      }),
    });

    const loginJson = await loginResp.json();
    const createResult = loginJson?.data?.customerAccessTokenCreate;

    const errors = createResult?.customerUserErrors ?? [];
    const accessToken = createResult?.customerAccessToken?.accessToken;

    if (!accessToken || errors.length) {
      res.status(401).json({
        error: errors[0]?.message || "Invalid email or password.",
        debug: loginJson,
      });
      return;
    }

    // 2) Load customer profile + default address
    const customerResp = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: CUSTOMER_QUERY,
        variables: { accessToken },
      }),
    });

    const customerJson = await customerResp.json();
    const customer = customerJson?.data?.customer;

    if (!customer) {
      res.status(500).json({ error: "Could not load customer from Shopify." });
      return;
    }

    const user = {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      name:
        customer.firstName && customer.lastName
          ? `${customer.firstName} ${customer.lastName}`
          : customer.firstName || customer.email,
      defaultAddress: customer.defaultAddress
        ? {
            id: customer.defaultAddress.id,
            name: customer.defaultAddress.name,
            line1: customer.defaultAddress.address1,
            line2: customer.defaultAddress.address2,
            city: customer.defaultAddress.city,
            state: customer.defaultAddress.province,
            zip: customer.defaultAddress.zip,
            country: customer.defaultAddress.country,
          }
        : null,
    };

    res.status(200).json({
      accessToken,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
