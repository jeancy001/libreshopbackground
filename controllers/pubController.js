import { Pub } from "../models/Pub.model.js";
import { uploadToSupabase } from "../services/supaBaseService.js";
import createError from "http-errors"


const createPub = async(req, res,next)=>{
 const {name,price} = req.body
 const imageUrls = req.file
 try {
    if(!name ||!price){
        return next(createError(403,"All fields are required."))
    }
    const images = await uploadToSupabase(imageUrls)
    const newPub = new Pub({
        name, 
        imageUrl:images,
        price
    })
    await newPub.save()
    res.status(200).json({success:true ,message:"Pub Created!",pub:newPub})
 } catch (error) {
    next(createError(500, "Internal Error "))
 }
}

const getPub = async(req, res, next)=>{
try {
    const pubs = await Pub.find({})
    if(!pubs)return next(createError(404, "NO Pub found"))
    res.status(200).json({success:true, message:"Pubs", pub:pubs})
} catch (error) {
    next(createError(500, "Internal Error "))
}
}

const  deletePub = async(req, res, next) =>{
 const {id} = req.params;
 try {
    const pubs = await Pub.findByIdAndDelete(id)
    if(!pubs)return next(createError(403, "No publication found with the given ID."))
    res.status(200).json({success:true,message:"Pub deleted! "})
 } catch (error) {
    next(createError(500, "Internal Error "))
 }
}


export {createPub, getPub, deletePub}