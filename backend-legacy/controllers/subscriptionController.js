import User from "../models/User.js";
import WebhookEvent from "../models/webhookEvent.js";
import { getProductConfig } from "../services/lemonSqueezy.js";

/**
 * Pretty-print JSON objects for debugging
 */
function logDeep(label, obj) {
  try {
    console.log(`\n=== ${label} ===`);
    console.log(JSON.stringify(obj, null, 2));
    console.log(`=== END ${label} ===\n`);
  } catch (err) {
    console.error(`Failed to stringify ${label}:`, err);
  }
}

/**
 * Extract common fields from Lemon event data
 */
function normalizeEvent(eventData, customData = {}) {
  const attributes = eventData?.attributes || {};

  return {
    subscriptionId: eventData?.id,
    productId: attributes.variant_id,
    periodEnd: attributes.renews_at,   // ✅ instead of current_period_end
    status: attributes.status,
    email: attributes.user_email,
    customData,
  };
}

/**
 * Find user either by ID (preferred) or by email
 */
async function findUser(customData, email) {
  logDeep("findUser -> customData", customData);

  if (customData?.user_id) {
    const u = await User.findById(customData.user_id);
    if (u) return u;
  }

  if (customData?.user_email || email) {
    const u = await User.findOne({ email: customData.user_email || email });
    if (u) return u;
  }

  return null;
}

/**
 * Apply subscription plan & credits to user
 */
async function applyPlanToUser(user, productId, subscriptionId, status, periodEnd) {
  logDeep("applyPlanToUser -> productId", productId);

  const config = getProductConfig(productId);

  if (!config) {
    console.warn("Unknown productId for plan mapping:", productId);
    // Fallback: expired/free tier with 0 credits
    user.subscriptionPlan = "free";
    user.credits = 0;
  } else {
    user.lemonSubscriptionId = subscriptionId ?? user.lemonSubscriptionId;
    user.subscriptionPlan = config.plan;
    user.subscriptionStatus = status ?? "active";

    // 🚨 Credits reset to the plan's monthly quota
    user.credits = config.credits;
  }

  if (periodEnd) {
    const dt =
      typeof periodEnd === "number"
        ? new Date(periodEnd * 1000)
        : new Date(periodEnd);
    user.subscriptionCurrentPeriodEnd = dt;
  }

  await user.save();
}

/* =======================================================
   Subscription Handlers
   ======================================================= */

export async function handleSubscriptionCreated(eventData, customData = {}) {
  const { productId, subscriptionId, periodEnd, email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) {
    console.warn("subscription_created: user not found", subscriptionId);
    return;
  }

  await applyPlanToUser(user, productId, subscriptionId, "active", periodEnd);
}

export async function handleSubscriptionUpdated(eventData, customData = {}) {
  const { productId, subscriptionId, periodEnd, email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) {
    console.warn("subscription_updated: user not found", subscriptionId);
    return;
  }

  await applyPlanToUser(user, productId, subscriptionId, "active", periodEnd);
}

export async function handleSubscriptionCancelled(eventData, customData = {}) {
  const { subscriptionId, periodEnd, email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) return;

  if (user.lemonSubscriptionId !== subscriptionId) return;

  user.subscriptionStatus = "cancelled";
  if (periodEnd) {
    const dt = new Date(periodEnd);
    user.subscriptionCurrentPeriodEnd = dt;
  }

  // ⚠️ Do NOT reset credits here (still valid until period end)
  await user.save();
}

export async function handleSubscriptionResumed(eventData, customData = {}) {
  return handleSubscriptionUpdated(eventData, customData);
}
export async function handleSubscriptionUnpaused(eventData, customData = {}) {
  return handleSubscriptionUpdated(eventData, customData);
}

export async function handleSubscriptionExpired(eventData, customData = {}) {
  const { subscriptionId, email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);
  if (!user) return;

  // 🚨 Only expire if THIS subscription is still the user's active one
  if (user.lemonSubscriptionId !== subscriptionId) {
    console.log(
      `Ignoring expired webhook for old subscription ${subscriptionId}, user is on ${user.lemonSubscriptionId}`
    );
    return;
  }

  user.subscriptionStatus = "expired";
  user.subscriptionPlan = "free";
  user.credits = 0;
  await user.save();
}


export async function handleSubscriptionPaused(eventData, customData = {}) {
  const { email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) return;

  if (user.lemonSubscriptionId !== subscriptionId) return;

  user.subscriptionStatus = "paused";
  await user.save();
}

/* =======================================================
   Payment Handlers
   ======================================================= */

export async function handlePaymentFailed(eventData, customData = {}) {
  const { email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) return;
  if (user.lemonSubscriptionId !== subscriptionId) return;

  user.subscriptionStatus = "past_due";
  await user.save();
  console.warn(`Payment failed for user ${user._id}. Start grace logic.`);
}

export async function handlePaymentSuccess(eventData, customData = {}) {
  const { productId, periodEnd, email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);
  if (!user) return;

  const config = getProductConfig(productId);

  if (config) {
    // ✅ Reset credits to the full plan allowance
    user.subscriptionPlan = config.plan;
    user.credits = config.credits;
  }

  if (periodEnd) {
    const dt = new Date(periodEnd);
    user.subscriptionCurrentPeriodEnd = dt;
  }

  user.subscriptionStatus = "active";
  await user.save();
}

export async function handlePaymentRecovered(eventData, customData = {}) {
  return handlePaymentSuccess(eventData, customData);
}

/* =======================================================
   Orders
   ======================================================= */

export async function handleOrderCreated(eventData, customData = {}) {
  return handleSubscriptionCreated(eventData, customData);
}

export async function handleOrderRefunded(eventData, customData = {}) {
  const { email } = normalizeEvent(eventData, customData);
  const user = await findUser(customData, email);

  if (!user) return;
  console.warn("Order refunded for user", user._id, "please reconcile manually", eventData.id);
}

/* =======================================================
   Webhook Dispatcher
   ======================================================= */

export async function handleLemonWebhook(event) {
  const eventType = event?.meta?.event_name;
  const eventData = event?.data;
  const customData = event?.meta?.custom_data || {};

  const eventId = `${eventType}_${eventData?.id}`;
  try {
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) return;
    await WebhookEvent.create({ eventId, eventType, payload: event, status: "processing" });
  } catch (e) {
    console.warn("WebhookEvent idempotency check skipped:", e.message);
  }

  switch (eventType) {
    case "subscription_created":
      await handleSubscriptionCreated(eventData, customData);
      break;
    case "subscription_updated":
      await handleSubscriptionUpdated(eventData, customData);
      break;
    case "subscription_cancelled":
      await handleSubscriptionCancelled(eventData, customData);
      break;
    case "subscription_resumed":
    case "subscription_unpaused":
      await handleSubscriptionResumed(eventData, customData);
      break;
    case "subscription_expired":
    case "subscription_paused":
      await handleSubscriptionExpired(eventData, customData);
      break;
    case "subscription_payment_failed":
      await handlePaymentFailed(eventData, customData);
      break;
    case "subscription_payment_success":
      await handlePaymentSuccess(eventData, customData);
      break;
    case "subscription_payment_recovered":
      await handlePaymentRecovered(eventData, customData);
      break;
    case "order_created":
      await handleOrderCreated(eventData, customData);
      break;
    case "order_refunded":
      await handleOrderRefunded(eventData, customData);
      break;
    default:
      console.log("Unhandled lemon event type:", eventType);
      break;
  }

  try {
    await WebhookEvent.updateOne(
      { eventId },
      { status: "processed", processedAt: new Date() }
    );
  } catch (e) {
    // non-fatal
  }
}

export default {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCancelled,
  handleSubscriptionResumed,
  handleSubscriptionExpired,
  handleSubscriptionPaused,
  handleSubscriptionUnpaused,
  handlePaymentFailed,
  handlePaymentSuccess,
  handlePaymentRecovered,
  handleOrderCreated,
  handleOrderRefunded,
  handleLemonWebhook,
};
