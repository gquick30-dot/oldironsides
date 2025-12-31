export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body || {};
  if (!email)
    return res.status(400).json({ success: false, error: "Email required" });

  try {
    const r = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-10/customers.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({
          customer: {
            email,
            // marketing opt-in
            accepts_marketing: true,
            // optional: tag these signups for segmentation
            tags: "promo_20_modal",
            // optional: helps email deliverability/segmentation
            marketing_opt_in_level: "single_opt_in",
          },
        }),
      }
    );

    const data = await r.json();

    // If customer already exists, Shopify returns 422 with error.
    // Treat that as success (we still got the email in the system).
    if (!r.ok) {
      const msg = JSON.stringify(data);
      if (r.status === 422) {
        return res.status(200).json({ success: true, note: "already_exists" });
      }
      return res.status(400).json({ success: false, error: msg });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: err?.message || "server_error" });
  }
}
