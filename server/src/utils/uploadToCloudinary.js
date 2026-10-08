const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (
  buffer,
  folder = "online-food-ordering"
) => {
  return new Promise((resolve, reject) => {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return reject(
        new Error("Invalid image buffer")
      );
    }

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error(
              "Cloudinary upload error:",
              error
            );

            return reject(error);
          }

          if (!result || !result.secure_url) {
            return reject(
              new Error(
                "Cloudinary did not return an image URL"
              )
            );
          }

          resolve(result);
        }
      );

    uploadStream.on("error", (error) => {
      console.error(
        "Cloudinary stream error:",
        error
      );

      reject(error);
    });

    uploadStream.end(buffer);
  });
};

module.exports = uploadToCloudinary;