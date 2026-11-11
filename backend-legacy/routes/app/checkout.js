import express from "express";
import {
  createCheckoutUrl,
  getProductConfig,
} from "../../services/lemonSqueezy.js";

const router = express.Router();

/**
 * POST /api/create-checkout
 * Create a LemonSqueezy checkout session
 */
router.post("/create-checkout", async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.userId;

    // Validate plan
    if (!plan || !["starter", "premium"].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be either "starter" or "premium"',
      });
    }

    // Map plan to variant ID
    const variantId =
      plan === "starter"
        ? process.env.PRODUCT_STARTER_ID
        : process.env.PRODUCT_PREMIUM_ID;

    if (!variantId) {
      return res.status(500).json({
        success: false,
        message: "Variant configuration not found",
      });
    }

    // Store ID (from dashboard)
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;
    if (!storeId) {
      return res.status(500).json({
        success: false,
        message: "Store ID not configured",
      });
    }

    // Get product configuration for validation
    const productConfig = getProductConfig(variantId);
    if (!productConfig) {
      return res.status(500).json({
        success: false,
        message: "Invalid product configuration",
      });
    }

    // Create checkout URL with store + variant
    const checkoutUrl = await createCheckoutUrl(storeId, variantId, {
      userId: userId.toString(),
      userEmail: req.user.email,
      plan: plan,
    });

    res.json({
      success: true,
      data: {
        checkoutUrl,
        plan: productConfig.plan,
        credits: productConfig.credits,
        price: productConfig.price,
      },
    });
  } catch (error) {
    console.error("Error creating checkout:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
    });
  }
});

/**
 * GET /api/subscription-status
 * Get current user's subscription status
 */
router.get("/subscription-status", async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        subscriptionPlan: user.subscriptionPlan || "free",
        subscriptionStatus: user.subscriptionStatus || null,
        subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
        lemonSubscriptionId: user.lemonSubscriptionId || null,
        credits: user.credits || 50,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription status",
    });
  }
});

export default router;
