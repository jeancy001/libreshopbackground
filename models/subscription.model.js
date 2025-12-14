import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planType: { type: String, enum: ["Free", "Standard", "Premium"] },
    price: { type: Number, required:true},
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true }, // must have an end date
    isActive: { type: Boolean, default: true } // true when subscription is currently active
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
