import express from "express";
import { verifyWebhookSignature } from "../../services/lemonSqueezy.js";
import * as subscriptionController from "../../controllers/subscriptionController.js";
import WebhookEvent from "../../models/webhookEvent.js";

const router = express.Router();

router.post(
  "/lemon",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-signature"];
      const rawBody = req.body; // Buffer ✅

      if (!signature || !verifyWebhookSignature(rawBody, signature)) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Parse JSON after verifying signature
      const event = JSON.parse(rawBody.toString("utf8"));
      const eventId = `${event.meta?.event_name}_${event.data?.id}`;
      const eventType = event.meta?.event_name;
      const customData = event.meta?.custom_data || {};

      // Idempotency check
      const existingEvent = await WebhookEvent.findOne({ eventId });
      if (existingEvent) {
        console.log(`Event ${eventId} already processed`);
        return res.status(200).json({ message: "Event already processed" });
      }

      const webhookEvent = new WebhookEvent({
        eventId,
        eventType,
        payload: event,
        status: "processing",
      });
      await webhookEvent.save();

      try {
        await processWebhookEvent(event, eventType, customData);
        webhookEvent.status = "processed";
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
        return res.status(200).json({ message: "Webhook processed successfully" });
      } catch (processingError) {
        console.error("Error processing webhook:", processingError);
        webhookEvent.status = "failed";
        webhookEvent.error = processingError.message;
        await webhookEvent.save();
        return res.status(200).json({ message: "Webhook received but processing failed" });
      }
    } catch (error) {
      console.error("Webhook error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

async function processWebhookEvent(event, eventType, customData) {
  const eventData = event.data;

  console.log(`Processing event: ${eventType} for subscription: ${eventData.id}`);

  switch (eventType) {
    case "subscription_created":
      await subscriptionController.handleSubscriptionCreated(eventData, customData);
      break;
    case "subscription_updated":
      await subscriptionController.handleSubscriptionUpdated(eventData, customData);
      break;
    case "subscription_cancelled":
      await subscriptionController.handleSubscriptionCancelled(eventData, customData);
      break;
    case "subscription_resumed":
      await subscriptionController.handleSubscriptionResumed(eventData, customData);
      break;
    case "subscription_expired":
      await subscriptionController.handleSubscriptionExpired(eventData, customData);
      break;
    case "subscription_paused":
      await subscriptionController.handleSubscriptionPaused(eventData, customData);
      break;
    case "subscription_unpaused":
      await subscriptionController.handleSubscriptionUnpaused(eventData, customData);
      break;
    case "subscription_payment_failed":
      await subscriptionController.handlePaymentFailed(eventData, customData);
      break;
    case "subscription_payment_success":
      await subscriptionController.handlePaymentSuccess(eventData, customData);
      break;
    case "subscription_payment_recovered":
      await subscriptionController.handlePaymentRecovered(eventData, customData);
      break;
    case "order_created":
      await subscriptionController.handleOrderCreated(eventData, customData);
      break;
    case "order_refunded":
      await subscriptionController.handleOrderRefunded(eventData, customData);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
      break;
  }
}

export default router;
