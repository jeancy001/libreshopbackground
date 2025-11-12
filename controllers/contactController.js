import { Contact } from "../models/contact.model.js";
import createError from "http-errors"



const createContact =async(req, res, next)=>{
const {name, email, description} = req.body;
try {
    if(!name ||!email ||!description)return next(createError(403, "All fields are required."))
    const newContact = new Contact({
        name,
        email,
        description
       })
    await newContact.save()
    res.status(200).json({success:true,message:"Contacts Sent!", contact:newContact })
} catch (error) {
    next(createError(500, "Error Creating Contacts."))
}
}

const getContacts =async(req, res, next)=>{
  try {
    const contacts = await Contact.find({}).sort({createdAt:-1})
    if(!contacts)return next(createError(403,"No Contact found!"))
   res.status(200).json({success:true, message:"Contacts", contact:contacts})
  } catch (error) {
    next(createError(500, "Error fetching Contacts."))
  }
}
const deleteContact = async(req, res, next) =>{
 const {id} = req.params;
 try {
    const contacts = await Contact.findByIdAndDelete(id)
    if(!contacts) return next(createError(404, "NO  Contacts  Found!"))
  res.status(200).json({success:true, message:"Contact deleted  successfully ! "})
 } catch (error) {
    next(createError(500, "Error Deleting Contacts."))
 }
}


export {createContact, getContacts,deleteContact}