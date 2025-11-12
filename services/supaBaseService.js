import fs from "fs";
import { supabase } from "../config/supabaseClient.js";

export async function uploadToSupabase(file) {
  try {
    if (!file) throw new Error("No file provided for upload");

    const fileExt = file.originalname?.split(".").pop() || "jpg";
    const fileName = `${Date.now()}.${fileExt}`;

    let fileContent;

    // ✅ Handle both memory and disk storage
    if (file.buffer) {
      // For multer.memoryStorage()
      fileContent = file.buffer;
    } else if (file.path) {
      // For multer.diskStorage()
      fileContent = fs.createReadStream(file.path);
    } else {
      throw new Error("File has neither buffer nor path");
    }

    // ✅ Upload to Supabase
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, fileContent, {
        contentType: file.mimetype,
        duplex: "half",
      });

    if (error) {
      console.error("Supabase upload error:", error.message);
      throw new Error("Failed to upload image to Supabase");
    }

    // ✅ Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase:", error.message);
    throw new Error("Error uploading image to Supabase");
  }
}
