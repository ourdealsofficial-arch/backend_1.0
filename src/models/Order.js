import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    foodName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    specialInstructions: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const orderBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderType: {
      type: String,
      enum: ["DINE_IN", "TAKEAWAY"],
      default: "DINE_IN",
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE"],
      required: true,
    },
    customerDetails: {
      name: {
        type: String,
      },
      phone: {
        type: String,
        default: "+91 1234567890",
      },
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
  },
  { timestamps: true }
);

orderBillSchema.index({ billNumber: -11 });
orderBillSchema.index({ paidAt: -1 });

const OrderBill = mongoose.model("OrderBill", orderBillSchema);
export default OrderBill;
