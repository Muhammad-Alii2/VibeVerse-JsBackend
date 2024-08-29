import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("File uploaded successfully: ", response.url);
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        console.error("Error uploading the file: ",error);
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (imagePublicID) => {
    try {
        if (!imagePublicID) {
            return null
        }
        const response = await cloudinary.uploader.destroy(imagePublicID)
        console.log(response)
        return response
    } catch (error) {
        console.error("Error deleting the file: ",error);
        return null
    }
}

export {
    uploadOnCloudinary,
    deleteFromCloudinary
}