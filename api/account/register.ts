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
        code
        field
        message
      }
    }
  }
`;

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

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "").trim();

    if (!name || !email || !password) {
      res.status(400).json({ error: "Missing name, email, or password." });
      return;
    }

    const [firstName, ...rest] = name.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    // 1) Create customer
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
            password,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
          },
        },
      }),
    });

    const createJson = await createResp.json();
    const createResult = createJson?.data?.customerCreate;
    const createErrors = createResult?.customerUserErrors ?? [];

    if (createErrors.length) {
      res.status(400).json({
        error: createErrors[0]?.message || "Registration failed.",
        debug: createJson,
      });
      return;
    }

    // 2) Login immediately (get customer access token)
    const loginResp = await fetch(STOREFRONT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: LOGIN_MUTATION,
        variables: { input: { email, password } },
      }),
    });

    const loginJson = await loginResp.json();
    const loginResult = loginJson?.data?.customerAccessTokenCreate;
    const loginErrors = loginResult?.customerUserErrors ?? [];
    const accessToken = loginResult?.customerAccessToken?.accessToken;

    if (!accessToken || loginErrors.length) {
      res.status(401).json({
        error: loginErrors[0]?.message || "Account created, but login failed.",
        debug: loginJson,
      });
      return;
    }

    // 3) Fetch customer profile
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

    res.status(200).json({ accessToken, user });
  } catch (err) {
    console.error("account-register handler error:", err);
    res.status(500).json({ error: "Unexpected server error." });
  }
}
