import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  analyticsBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalOrders: {
    type: Number,
    required: true,
    min: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  popularItems: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
}, {
  timestamps: true
});

// Index for better query performance
analyticsSchema.index({ date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;