import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
    name:{type:String,  required:true},
    description:{type:String,required:true},
    imageUrl:[{type:String}],
    price:{type:Number, required:true},
    discountPercentage: { type: Number },
    priceAfterDiscount:{type: Number},
    category: { type: String, required: true },// Category name (e.g., Electronics, Fashion)
    brand: { type: String },  // Brand name
    rating: { type: Number, min: 0, max: 5 },// Rating (from 0 to 5 stars)
    stock: { type: Number, default: 0 },  // Stock quantity
    status: { type: String, enum: ['available', 'out_of_stock', 'discontinued'], default: 'available' },  // Product status
    deliveryOptions: [{ 
        type: String, 
        enum: ['Standard', 'Express', 'Pickup'],
        required: true 
    }]
},{timestamps:true})

export const Products = mongoose.model("Products",productSchema)