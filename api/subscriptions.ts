// api/subscriptions.ts

export default function handler(req: any, res: any) {
  // Simple sanity check so we know it's our code
  console.log("[TEST] /api/subscriptions hit");

  res.status(200).json({
    subscriptions: [
      {
        id: "test-sub-1",
        status: "active",
        subscription_name: "Test Coffee Subscription",
        rule_name: "Every 14 days",
        next_billing: "2025-12-01",
        delivery_interval: "14 days",
        billing_interval: "14 days",
        items: [
          {
            id: "test-item-1",
            title: "Flagship Medium Roast",
            quantity: 1,
            price: 999,
          },
        ],
      },
    ],
  });
}
