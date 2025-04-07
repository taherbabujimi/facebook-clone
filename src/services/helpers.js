const cloudinary = require("cloudinary").v2;

const createUploadSignature = async (resource_type, expires_at, timestamp) => {
  const params = {
    timestamp,
    // folder: "facebook-clone",
    // resource_type,
    // max_file_size: 25000000,
    // expires_at,
  };

  // This is the correct way to sign requests with Cloudinary
  const signature = cloudinary.utils.sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    ...params,
    signature,
  };
};

module.exports = {
  createUploadSignature,
};
