const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const streamifier = require('streamifier');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBufferToCloudinary(buffer, originalname, folder = process.env.CLOUDINARY_FOLDER || 'smartinvo_uploads') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: uuidv4(),
        folder,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

function deleteFromCloudinary(publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

function extractPublicIdFromUrl(url) {
  try {
    // Extract public ID from Cloudinary URL
    // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      // Skip version number and get the rest
      const publicIdParts = urlParts.slice(uploadIndex + 2);
      // Remove file extension
      const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
      return publicId;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl }; 