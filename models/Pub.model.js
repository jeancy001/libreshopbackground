import mongoose from "mongoose";
const pubSchema = new mongoose.Schema({
    name:{type:String,required:true},
    imageUrl:{type:String, required:true},
    price:{type:Number,required:true,default:'0'}
},{timestamps:true})

export  const Pub = mongoose.model("Pub",pubSchema)