import {
  lemonSqueezySetup,
  createCheckout,
  getSubscription,
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";

// Initialize LemonSqueezy SDK
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEESY_TEST_API_KEY,
  onError: (error) => console.error("LemonSqueezy API Error:", error),
});

/**
 * Create a hosted checkout URL
 * @param {string} storeId - Lemon Squeezy store ID
 * @param {string} variantId - Lemon Squeezy variant ID
 * @param {Object} metadata - Custom metadata to include (user info, plan, etc.)
 * @returns {Promise<string>} - Checkout URL
 */
export const createCheckoutUrl = async (storeId, variantId, metadata = {}) => {
  try {
    const checkout = await createCheckout(storeId, variantId, {
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      checkoutData: {
        custom: metadata,
      },
      expiresAt: null,
      preview: false,
      testMode: process.env.NODE_ENV !== "production",
    });

    console.log("Checkout created:", checkout);

    // The URL is usually at checkout.data.attributes.url
    return checkout.data.data.attributes.url || null;
  } catch (error) {
    console.error("Error creating checkout:", error);
    throw new Error("Failed to create checkout URL");
  }
};

/**
 * Verify webhook signature
 * @param {string} rawBody - Raw request body
 * @param {string} signature - Webhook signature from headers
 * @returns {boolean} - Whether signature is valid
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
  }

  // rawBody is a Buffer from express.raw()
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody) // 👈 no encoding arg here
    .digest("hex");

  return signature === expectedSignature;
};

/**
 * Get subscription details from LemonSqueezy
 * @param {string} subscriptionId - LemonSqueezy subscription ID
 * @returns {Promise<Object>} - Subscription data
 */
export const getSubscriptionDetails = async (subscriptionId) => {
  try {
    const subscription = await getSubscription(subscriptionId);
    return subscription.data;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    throw new Error("Failed to fetch subscription details");
  }
};

/**
 * Map product ID to plan details
 * @param {string} productId - LemonSqueezy product ID
 * @returns {Object} - Plan configuration
 */
export const getProductConfig = (productId) => {
  const configs = {
    [process.env.PRODUCT_STARTER_ID]: {
      plan: "starter",
      credits: 1000,
      price: 29,
    },
    [process.env.PRODUCT_PREMIUM_ID]: {
      plan: "premium",
      credits: 5000,
      price: 99,
    },
  };

  return configs[productId] || null;
};
