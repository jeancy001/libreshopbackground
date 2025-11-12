import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',  // Reference to the order this transaction is linked to
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',  // Reference to the seller or vendor making the sale
        required: true
    },
    transactionAmount: { type: Number, required: true },  // Total transaction amount
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'bank_transfer', 'cash_on_delivery'],
        required: true
    },
    paymentDate: { type: Date, default: Date.now },
    shippingStatus: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'returned'],
        default: 'pending'
    },
    shippingMethod: {
        type: String,
        enum: ['standard', 'express'],
        required: true
    },
    transactionDate: { type: Date, default: Date.now }, 
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
