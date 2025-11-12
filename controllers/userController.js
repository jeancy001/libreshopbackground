import createError from "http-errors";
import { User } from "../models/user.model.js";
import bcrypt  from "bcryptjs"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
import { uploadToSupabase } from "../services/supaBaseService.js";
import * as crypto from "node:crypto"


//send Email 
const  transporter = nodemailer.createTransport({
  service:"gmail",
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth:{
    user:process.env.USER_EMAIL,
    pass:process.env.EMAIL_PASS
  }
})

const register = async(req, res, next)=>{
const {username, email, password,address,tel} = req.body;
const userProfile = req?.file || null;
 try {
     const userExist  = await User.findOne({email})
     if(userExist)return next(createError(403,"User  with  this  email already  exists."))
     if(!username||!email||!password ){
        return next(createError(403, "All fields are required."))
     }
     const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
     if(!isValidEmail)return next(createError(403,"The email  must be  valid."))

    const hasPassword = bcrypt.hashSync(password, 10)
    const newUser = new User({
        username,
        email,
        password:hasPassword,
        profileUrl:userProfile,
        address,
        tel
    })
    await newUser.save()
    const token = jwt.sign({id:newUser._id, username:newUser.username,email:newUser.email, role:newUser.role, tel:newUser.tel},process.env.JWT_SECRET,{expiresIn:'7d'})

    res.cookie("token",token,{
        httpOnly:true,
        secure:false,
        maxAge: 24*60*60*1000
    })
 
    res.status(201).json({success:true,message:"New User registered successfully.",token, user:{
      id:newUser._id,
      username:newUser.username,
      email:newUser.email,
      role:newUser.role,
      tel:newUser.tel
    } })
 } catch (error) {
     next(createError(500, "Internal  Error "))
 }

}



const login = async(req , res, next)=>{
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email})
        if(!user) return next(createError(404, "User  or password  incorrect."))
        const isValidPassword = bcrypt.compareSync(password,user.password)
       if(!isValidPassword)return next(createError(403, "Username  or  password is  incorrect"))
       
     const token = jwt.sign({id:user._id,
         username:user.username,
         email:user.email,
         profileUrl:user.profileUrl,
         address:user.address,
         tel:user.tel,
         role:user.role
        }, process.env.JWT_SECRET, {expiresIn:"7d"})

    res.cookie("token",token,{
      httpOnly:true,
      secure:false,
      maxAge:24*60*60*1000
    })
    res.status(201).json({success:true,message:"Login  successfully", token,user:{
        username:user.username,
        email:user.email,
        profileUrl:user.profileUrl,
        address:user.address,
        tel:user.tel,
        role:user.role
    }})
    } catch (error) {
        next(createError(500, "Internal error occured."))
    }

}


const logout = async (req, res, next) => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      res.status(200).json({ success: true, message: "Logged out successfully." });
    } catch (error) {
      next(error); 
    }
  };
const getMe = async(req, res, next)=>{
    try {
        const user = await User.findById(req.user.id).select("-password")
        if(!user)return next(createError(404,"User not  found."))
        res.status(201).json({success:true, user})

    } catch (error) {
        next(createError(500, "Internal or server  error"))
    }
}
const updatePassword = async (req, res, next) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
  
    try {
      const user = await User.findById(userId);
      if (!user) return next(createError(404, "User not found"));
  
      const isMatch = bcrypt.compareSync(currentPassword, user.password);
      if (!isMatch) return next(createError(403, "Current password is incorrect"));
  
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      user.password = hashedPassword;
  
      await user.save();
  
      res.status(200).json({
        success: true,
        message: "Password changed successfully!",
      });
    } catch (error) {
      next(createError(500, "Internal server error"));
    }
  };
  

  const updateProfile = async (req, res, next) => {
    const userId = req.user?.id;
    const { username, email, tel } = req.body;
    const profileFile = req.file;
  
    try {
      const user = await User.findById(userId);
      if (!user) return next(createError(404, "User not found"));
  
      let updatedProfileUrl = user.profileUrl;
  
      // 📦 Upload image to Supabase if new one is provided
      if (profileFile) {
        updatedProfileUrl = await uploadToSupabase(profileFile);
        if (!updatedProfileUrl) {
          return next(createError(400, "Profile image upload failed"));
        }
        user.profileUrl = updatedProfileUrl;
      }
  
      // ✅ Update fields if provided
      if (username) user.username = username;
      if (email) user.email = email;
      if (tel) user.tel = tel;
  
      if (req.body.address) {
        try {
          const parsedAddress = JSON.parse(req.body.address);
          if (Array.isArray(parsedAddress)) {
            user.address = parsedAddress;
          } else {
            return next(createError(400, "Address must be an array"));
          }
        } catch (err) {
          return next(createError(400, "Invalid address format"));
        }
      }
  
      await user.save();
  
      const { password, ...userData } = user._doc;
  
      res.status(200).json({
        success: true,
        message: "Profile updated successfully!",
        user: userData,
      });
    } catch (error) {
      console.error(error);
      next(createError(500, "Internal server error"));
    }
  };
  
//----------------------------------------------------------------------------------------------------


const requestCode = async(req, res, next)=>{
  const {email} = req.body
  try {
    const  user = await User.findOne({email})
    if(!user)return next(createError(404, "No user find with  this email  or email  incorrect"))
    const code = crypto.randomBytes(3).toString('hex')
     user.resetCode = code;
     user.resetCodeExpires = Date.now() + 3600000
     await user.save()

     const mailsOptions={
      from:'ttelectronicsapril2025@gmail.com',
      to: email,
      subject: 'Password Reset Code.',
      text: `Your password  reset code is: ${code}. it will  expire in an hour!`
     }

// FIXED
    transporter.sendMail(mailsOptions, (err, info) => {
      if (err) return next(createError(500, "Email failed"))
      return res.status(200).json({ success: true, message: "Reset code sent" })
    })

  res.status(200).json({success:true, message:"Reset code sent"})
 
  } catch (error) {
    next(createError(500,"Internal  error occured."))
  }
}

//rest-password 
const resetPassword = async(req, res, next)=>{
const {email, code, newPassword} = req.body
try {
  const  user = await User.findOne({email})
  if(!email || user.resetCode !== code || user.resetCodeExpires <Date.now()) return  next(createError(400, "Invalid or expired reset code."))

 
  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  user.password  = hashedPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined
  await user.save()

  const mailsOptions={
    from:process.env.USER_EMAIL,
    to: email,
    subject: "Password Changed  successfully!.",
    text: `Congratulations! Your password has been changed successfully.\nPlease return to our website to log in.`

  
   }

   transporter.sendMail(mailsOptions, (err, info) => {
    if (err) return next(createError(500, "Email failed"))
    return res.status(200).json({ success: true, message: "Your password has been changed!" })
  })
} catch (error) {
  next(createError(500,"Internal  error occured."))
}
}


const deletUser = async(req, res, next)=>{
  const {id} = req.params ;
  try {
    const user  = await User.findByIdAndDelete(id)
    if(!user) return next(createError(404, "No  User Found!"))
    res.status(200).json({success:true, message:"User deleted Successfully !"})
  } catch (error) {
    next(createError(500,"Internal  error occured."))
  }

}
const getAllUser = async(req, res, next)=>{
try {
  const user = await User.find({})
  .select("-password")
  .sort({createdAt: -1})
  if(!user)return next(createError(404, "No User found!"))
  res.status(200).json({success:true, message:"All users",users:user})
} catch (error) {
  next(createError(500,"Internal  error occured."))
}
}




export{register,login,logout, updatePassword, getMe ,updateProfile,requestCode, resetPassword, deletUser, getAllUser }