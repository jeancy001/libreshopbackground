import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileUrl: { type: String, required: false },
    address: [
        {
          type: { type: String, required: false },
          city: { type: String, required: false },
          street: { type: String, required: false },
          postalCode: { type: String, required: false },
          country: { type: String, required: false }
        }
      ],
    tel:{ type: String, required: false }, 
    resetCode:{type:String},
    resetCodeExpires:{type:String},
    role:{ type: String, enum: ["client", "admin"], default: "client" }
  },
  { timestamps: true}
);
export const User = mongoose.model("User", userSchema);
