import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending',
    index: true
  },
  error: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for cleanup queries
webhookEventSchema.index({ createdAt: 1 });

// Method to mark event as processed
webhookEventSchema.methods.markProcessed = function() {
  this.status = 'processed';
  this.processedAt = new Date();
  return this.save();
};

// Method to mark event as failed
webhookEventSchema.methods.markFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  return this.save();
};

// Static method to cleanup old events (optional)
webhookEventSchema.statics.cleanupOldEvents = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: 'processed'
  });
};

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

export default WebhookEvent