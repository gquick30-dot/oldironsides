export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const response = await fetch(
    `https://${process.env.SHOPIFY_DOMAIN}/api/2023-10/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token":
          process.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `
            mutation customerCreate($input: CustomerCreateInput!) {
              customerCreate(input: $input) {
                customer {
                  id
                  email
                }
                customerUserErrors {
                  message
                }
              }
            }
          `,
        variables: {
          input: {
            email,
            acceptsMarketing: true,
          },
        },
      }),
    }
  );

  const data = await response.json();

  // Ignore duplicate email errors
  return res.status(200).json({ success: true });
}
