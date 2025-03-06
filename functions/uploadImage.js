// import cloudinary from "../config/cloudinary.js";
// import fs from "fs";

// const uploadImage = async (image) => {
//     try {
//         // if (!image?.path) return { success: false, message: "Image not found" };

//         const uploadResult = await cloudinary.uploader.upload(image.path, { resource_type: "auto" });
//         console.log(image, "image");

//         fs.unlinkSync(image.path);

//         return { success: true, message: "Image uploaded", url: uploadResult.url };
//     } catch (error) {
//         console.error("Image Upload Error:", error);
//         return { success: false, message: "Upload failed", url: null };
//     }
// };

// export default uploadImage;
