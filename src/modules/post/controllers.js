// const cloudinary = require("cloudinary").v2;
const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { addPostSchema, updatePostSchema } = require("./validations");
const { createUploadSignature } = require("../../services/helpers");

const { cloudinary } = require("../../config/cloudinary");
const { Sequelize } = require("sequelize");

module.exports.getUploadSignature = async (req, res) => {
  try {
    // const resource_type = "auto";

    const timestamp = new Date().getTime();

    // const expires_at = Math.floor((Date.now() + 3600000) / 1000);

    // const signature = await createUploadSignature(
    //   resource_type,
    //   expires_at,
    //   timestamp
    // );

    const signature = await cloudinary.utils.sign_request(
      {
        timestamp,
        folder: "facebook-clone",
      },
      {
        api_secret: process.env.CLOUDINARY_API_SECRET,
        api_key: process.env.CLOUDINARY_API_KEY,
      }
    );

    console.log("SIGNATURE: ", signature);

    return successResponseData(
      res,
      {
        timestamp: signature.timestamp,
        signature: signature.signature,
        // expires_at,
        // folder: signature.folder,
        // resourceType: signature.resource_type,
        // expiresAt: signature.expires_at,
        // max_file_size: signature.max_file_size,
      },
      200
    );
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorGettingUploadSing, 400);
  }
};

module.exports.addRepostPost = async (req, res) => {
  try {
    const validationResponse = addPostSchema(req.body, res);
    if (validationResponse !== false) return;

    const {
      status,
      caption,
      location,
      originalPostId,
      filePublicId,
      fileResourceType,
    } = req.body;

    // Create post data object with common fields
    const postData = {
      createdBy: req.user.id,
      status,
      caption,
      location,
      filePublicId,
      fileResourceType,
    };

    // Handle repost case
    if (originalPostId !== undefined) {
      const originalPost = await Models.Post.findByPk(originalPostId);

      if (!originalPost) {
        return errorResponseWithoutData(res, messages.postNotExists, 400);
      }

      // Set originalPostId
      postData.originalPostId = originalPostId;

      // Set rootPostId based on original post
      postData.rootPostId = originalPost.rootPostId || originalPost.id;
    }

    // Create the post
    const post = await Models.Post.create(postData);

    return successResponseData(res, post, 200, messages.postAddSuccess);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorAddingPost, 400);
  }
};

module.exports.getPost = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return errorResponseWithoutData(res, messages.postIdNotProvided, 400);
    }

    const post = await Models.Post.findByPk(id, {
      attributes: {
        exclude: [
          "createdBy",
          "originalPostId",
          "rootPostId",
          "status",
          "filePublicId",
        ],
        include: [
          [Sequelize.fn("COUNT", Sequelize.col("Likes.id")), "likesCount"],
          [
            Sequelize.fn("COUNT", Sequelize.col("Comments.id")),
            "commentsCount",
          ],
        ],
      },
      include: [
        {
          model: Models.Like,
          as: "Likes",
          attributes: [],
        },
        {
          model: Models.Comment,
          where: {
            parentId: null,
          },
          as: "Comments",
          attributes: [],
          required: false,
        },
        {
          model: Models.Post,
          as: "originalPost",
          attributes: ["id", "caption", "location", "createdAt", "updatedAt"],
        },
        {
          model: Models.Post,
          as: "rootPost",
          attributes: ["id", "filePublicId"],
        },
      ],
      group: ["Post.id", "originalPost.id", "rootPost.id"],
    });

    let data = post;

    if (post.dataValues.rootPost === null) {
      data = {
        ...post.dataValues,
        rootPost: "the original content is no longer available.",
      };
    }

    if (!post) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    return successResponseData(res, data, 200, messages.getPostSuccess);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorGettingPost, 400);
  }
};

module.exports.updatePost = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return errorResponseWithoutData(res, messages.postIdNotProvided, 400);
    }

    const post = await Models.Post.findOne({ where: { id } });

    if (!post) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    if (post.createdBy !== req.user.id) {
      return errorResponseWithoutData(res, messages.postIsNotYours, 400);
    }

    const validationResponse = updatePostSchema(req.body, res);
    if (validationResponse !== false) return;

    const { status, caption, location } = req.body;

    const updatePost = await Models.Post.update(
      { status, caption, location },
      { where: { id } }
    );

    if (!post) {
      return errorResponseWithoutData(res, messages.errorUpdatingPost, 400);
    }

    return successResponseData(
      res,
      updatePost,
      200,
      messages.postUpdateSuccess
    );
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorUpdatingPost, 400);
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return errorResponseWithoutData(res, messages.postIdNotProvided, 400);
    }

    const postExists = await Models.Post.findByPk(id);

    if (!postExists) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    if (postExists.createdBy !== req.user.id) {
      return errorResponseWithoutData(res, messages.postIsNotYours, 400);
    }

    if (
      postExists.dataValues.filePublicId !== null &&
      postExists.dataValues.fileResourceType !== null
    ) {
      try {
        const result = await cloudinary.uploader.destroy(
          postExists.dataValues.filePublicId,
          { resource_type: postExists.dataValues.fileResourceType }
        );
        console.log("Cloudinary delete result:", result);

        // Check if Cloudinary couldn't find the file
        if (result.result === "not found") {
          throw new Error("File not found in Cloudinary");
        }
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        return errorResponseWithoutData(
          res,
          "Error deleting file from cloud storage",
          400
        );
      }
    }

    await Models.Post.destroy({
      where: { id },
    });

    return successResponseWithoutData(res, messages.postDeleteSuccess, 200);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(res, messages.errorDeletePost, 400);
  }
};
