const API_VERSION = "2025-01";
const SHOPIFY_DOMAIN = (import.meta.env.VITE_SHOPIFY_STORE_DOMAIN ?? "").trim();
const STOREFRONT_TOKEN = (
  import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN ?? ""
).trim();

if (!SHOPIFY_DOMAIN.endsWith(".myshopify.com")) {
  throw new Error(
    "[Shopify] VITE_SHOPIFY_STORE_DOMAIN missing/invalid (expected '<sub>.myshopify.com')."
  );
}
if (!STOREFRONT_TOKEN || STOREFRONT_TOKEN.length < 20) {
  throw new Error("[Shopify] VITE_SHOPIFY_STOREFRONT_TOKEN missing/invalid.");
}

// one-time sanity log
console.log(
  "[Shopify] Endpoint:",
  `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`
);

// ---- Core fetch ----
async function sf<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error("[Shopify] GraphQL error:", json.errors || json);
    throw new Error("Shopify Storefront API error");
  }
  return json.data as T;
}

// ---- Types (minimal) ----
export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: {
    edges: Array<{
      node: {
        id: string;
        quantity: number;
        merchandise: {
          id: string;
          title?: string;
          product?: { title: string };
        };
      };
    }>;
  };
};

// ---- Fragments ----
const CART_FRAGMENT = `
fragment CartBasics on Cart {
  id
  checkoutUrl
  totalQuantity
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            product { title }
          }
        }
      }
    }
  }
}
`;

// ===================
// Public API
// ===================

export async function getProductByHandle(handle: string) {
  const query = /* GraphQL */ `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        variants(first: 50) {
          edges {
            node {
              id
              title
              availableForSale
              selectedOptions {
                name
                value
              }
              price {
                amount
                currencyCode
              }
            }
          }
        }
        sellingPlanGroups(first: 5) {
          edges {
            node {
              name
              sellingPlans(first: 10) {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await sf<{ product: any }>(query, { handle });
  return data.product;
}

export async function cartCreate(): Promise<{
  id: string;
  checkoutUrl: string;
}> {
  const mutation = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          ...CartBasics
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await sf<{
    cartCreate: { cart: Cart | null; userErrors: any[] };
  }>(mutation, { input: {} });
  const { cart, userErrors } = data.cartCreate || {};
  if (!cart) {
    console.error("[Shopify] cartCreate errors:", userErrors);
    throw new Error("Failed to create cart");
  }
  saveCartLocal({ id: cart.id, checkoutUrl: cart.checkoutUrl });
  return { id: cart.id, checkoutUrl: cart.checkoutUrl };
}

export async function ensureCart(): Promise<{
  id: string;
  checkoutUrl: string;
}> {
  const cached = getCartLocal();
  if (cached) {
    // Verify it still exists
    try {
      const exists = await getCart(cached.id);
      if (exists?.id) return cached;
    } catch (_) {
      // fall through to create new
    }
  }
  return cartCreate();
}

export async function getCart(id: string): Promise<Cart | null> {
  const query = /* GraphQL */ `
    ${CART_FRAGMENT}
    query GetCart($id: ID!) {
      cart(id: $id) {
        ...CartBasics
      }
    }
  `;
  const data = await sf<{ cart: Cart | null }>(query, { id });
  return data.cart;
}

/**
 * Add ONE line. (Matches how you’re calling it.)
 */
export async function cartLinesAdd(params: {
  cartId: string;
  merchandiseId: string;
  quantity: number;
  attributes?: Record<string, string>;
  sellingPlanId?: string;
}) {
  const mutation = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartBasics
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const line: any = {
    merchandiseId: params.merchandiseId,
    quantity: params.quantity,
  };
  if (params.attributes) {
    line.attributes = Object.entries(params.attributes).map(([key, value]) => ({
      key,
      value,
    }));
  }
  if (params.sellingPlanId) line.sellingPlanId = params.sellingPlanId;

  const data = await sf<{
    cartLinesAdd: { cart: Cart | null; userErrors: any[] };
  }>(mutation, { cartId: params.cartId, lines: [line] });

  if (data.cartLinesAdd.userErrors?.length) {
    console.error(
      "[Shopify] cartLinesAdd errors:",
      data.cartLinesAdd.userErrors
    );
    throw new Error("Failed to add to cart");
  }

  const cart = data.cartLinesAdd.cart!;
  saveCartLocal({ id: cart.id, checkoutUrl: cart.checkoutUrl });
  return cart;
}

/**
 * Update quantities for multiple lines.
 */
export async function cartLinesUpdate(params: {
  cartId: string;
  lines: { id: string; quantity: number }[];
}) {
  const mutation = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartBasics
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await sf<{
    cartLinesUpdate: { cart: Cart | null; userErrors: any[] };
  }>(mutation, params);

  if (data.cartLinesUpdate.userErrors?.length) {
    console.error(
      "[Shopify] cartLinesUpdate errors:",
      data.cartLinesUpdate.userErrors
    );
    throw new Error("Failed to update cart");
  }

  return data.cartLinesUpdate.cart!;
}

/**
 * Remove lines by ID.
 */
export async function cartLinesRemove(params: {
  cartId: string;
  lineIds: string[];
}) {
  const mutation = /* GraphQL */ `
    ${CART_FRAGMENT}
    mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartBasics
        }
        userErrors {
          field
          message
        }
      }
    }
  `;
  const data = await sf<{
    cartLinesRemove: { cart: Cart | null; userErrors: any[] };
  }>(mutation, params);

  if (data.cartLinesRemove.userErrors?.length) {
    console.error(
      "[Shopify] cartLinesRemove errors:",
      data.cartLinesRemove.userErrors
    );
    throw new Error("Failed to remove from cart");
  }

  return data.cartLinesRemove.cart!;
}

// ===================
// Local storage helpers
// ===================
const CART_KEY = "shopify_cart";

function saveCartLocal(cart: { id: string; checkoutUrl: string }) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (_) {}
}

function getCartLocal(): { id: string; checkoutUrl: string } | null {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function getSellingPlanIds(product: any): string[] {
  return (
    product?.sellingPlanGroups?.edges?.flatMap((g: any) =>
      g?.node?.sellingPlans?.edges?.map((e: any) => e?.node?.id)
    ) || []
  );
}
