// controllers/productController.js

import { uploadToSupabase } from "../services/supaBaseService.js";
import { Products } from "../models/product.model.js";
import createError from "http-errors";

const createProducts = async (req, res) => {
    const { 
        name, 
        description, 
        price,
        discountPercentage,
        priceAfterDiscount,
        category,
        brand,
        rating,
        stock,
        deliveryOptions
    } = req.body;
    const imageFiles = req.files;

    try {
        if (
            !name || 
            !description || 
            !price || 
            !category || 
            !deliveryOptions ||
            !imageFiles || imageFiles.length === 0
        ) {
            return res.status(400).json({ success: false, message: "Name, description, price, category, delivery options, and images are required." });
        }

        // Upload the images to Supabase
        const imageUrls = await Promise.all(
            imageFiles.map(async (file) => {
                return await uploadToSupabase(file);
            })
        );
        
        //add discount 
        const disaccount = price - (price * discountPercentage / 100);

        // Create a new product
        const newProduct = new Products({
            name,
            description,
            imageUrl: imageUrls,
            price,
            discountPercentage, 
            priceAfterDiscount:disaccount,
            category, 
            brand,
            rating,
            stock,
            deliveryOptions
        });

        await newProduct.save();

        res.status(201).json({ success: true, message: "Product created successfully.", product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Something went wrong." });
    }
};

const getAllproducts = async (req, res) => {
    try {
        const products = await Products.find({}).sort({createdAt:-1});
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: "No products found." });
        }

        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "An error occurred while fetching products." });
    }
};

const getProductId = async(req , res)=>{
    const {id} = req.params;
    try {
     const singleProducts = await Products.findById(id);
     if(!singleProducts) return res.status(404).json({success:false, message:"No  product found"})
     return res.status(200).json({success:true, message:"single Product.", product:singleProducts})
    } catch (error) {
        
    }
}

const deleteProduct = async(req, res, next)=>{
     const {id} =req.params;
     try {
        const productDelete = await Products.findByIdAndDelete(id)
        if(!productDelete)return next(createError(404, "No product found with  this  ID"))
        res.status(200).json({sucess:true, message:"Product deleted successfully!"})        
     } catch (error) {
        next(createError(500, "Internal  error"))
     }
}

const updateProducts = async (req, res, next) => {
    const { id } = req.params;
    const productBody = req.body;
    const imageFiles = req.files; // <-- handle multiple files
  
    try {
      if (!productBody || Object.keys(productBody).length === 0) {
        return next(createError(403, "All fields are required."));
      }
  
      // Upload new images if provided
      if (imageFiles && imageFiles.length > 0) {
        const imageUrls = await Promise.all(
          imageFiles.map(file => uploadToSupabase(file))
        );
        productBody.imageUrl = imageUrls; // Update the imageUrl field
      }
  
      const updatedProduct = await Products.findByIdAndUpdate(id, productBody, {
        new: true
      });
  
      if (!updatedProduct) {
        return next(createError(404, "No product found with this ID."));
      }
  
      res.status(200).json({
        success: true,
        message: "Product updated successfully!",
        data: updatedProduct,
      });
    } catch (error) {
      console.error(error);
      next(createError(500, "Internal server error"));
    }
  };
  
  
export { createProducts, getAllproducts, getProductId ,deleteProduct,updateProducts };
