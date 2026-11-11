import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      default: 30, // free credits on signup
      min: 0, // never go below 0
    },
    lemonSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },

    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "premium"],
      default: "free",
      index: true,
    },

    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "cancelled",
        "past_due",
        "trialing",
        "paused",
        "expired",
      ],
      default: null,
      index: true,
    },

    subscriptionCurrentPeriodEnd: {
      type: Date,
      default: null,
    },

    // Optional: Track when subscription was last updated
    subscriptionUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
  return this.subscriptionStatus === 'active' && 
         this.subscriptionCurrentPeriodEnd && 
         new Date() < this.subscriptionCurrentPeriodEnd;
};

// Check if user is in grace period (cancelled but still has access)
userSchema.methods.isInGracePeriod = function() {
  return this.subscriptionStatus === 'cancelled' && 
         this.subscriptionCurrentPeriodEnd && 
         new Date() < this.subscriptionCurrentPeriodEnd;
};

// Get effective plan (considers grace period)
userSchema.methods.getEffectivePlan = function() {
  if (this.hasActiveSubscription() || this.isInGracePeriod()) {
    return this.subscriptionPlan;
  }
  return 'free';
};

// Check if user can use paid features
userSchema.methods.canUsePaidFeatures = function() {
  return this.getEffectivePlan() !== 'free';
};

const User = mongoose.model("User", userSchema);

export default User;
