export default async function handler(req, res) {
  const { email, name } = req.body || {};

  const [firstName, ...rest] = (name || "").trim().split(" ");
  const lastName = rest.join(" ");

  if (req.method !== "POST") return res.status(405).end();

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
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            accepts_marketing: true,
            tags: "promo_20_modal",
            marketing_opt_in_level: "single_opt_in",
            send_email_invite: false,
          },
        }),
      }
    );

    const data = await r.json();

    // If customer already exists, Shopify returns 422 with error.
    // Treat as success but DO NOT resend invite (prevents spam).
    if (!r.ok) {
      if (r.status === 422) {
        return res.status(200).json({ success: true, note: "already_exists" });
      }
      return res
        .status(400)
        .json({ success: false, error: JSON.stringify(data) });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res
      .status(500)
      .json({ success: false, error: err?.message || "server_error" });
  }
}
