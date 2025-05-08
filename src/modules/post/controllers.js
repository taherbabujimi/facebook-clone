const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  addPostSchema,
  updatePostSchema,
  getPostsSchema,
} = require("./validations");
const { Op } = require("sequelize");

const { cloudinary } = require("../../config/cloudinary");
const { Sequelize } = require("sequelize");
const { sequelize } = require("../../models/index");

module.exports.getUploadSignature = async (req, res) => {
  try {
    const timestamp = new Date().getTime();

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

    return successResponseData(
      res,
      {
        timestamp: signature.timestamp,
        signature: signature.signature,
      },
      200
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingUploadSing}: ${error}`,
      400
    );
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
      pageId,
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

    if (pageId !== undefined) {
      const pageExists = await Models.Page.findByPk(pageId);

      if (!pageExists) {
        return errorResponseWithoutData(res, messages.pageNotExists, 400);
      }

      if (pageExists.pageOwner !== req.user.id) {
        return errorResponseWithoutData(res, messages.pageNotYours, 400);
      }

      postData.pageId = pageId;
    }

    // Handle repost case
    if (originalPostId !== undefined) {
      const originalPost = await Models.Post.findByPk(originalPostId);

      if (!originalPost) {
        return errorResponseWithoutData(res, messages.postNotExists, 400);
      }

      const blockedUser = await Models.BlockedUser.findOne({
        where: {
          [Op.or]: [
            {
              blockedBy: req.user.id,
              blockedUser: originalPost.dataValues.createdBy,
            },
            {
              blockedBy: originalPost.dataValues.createdBy,
              blockedUser: req.user.id,
            },
          ],
        },
      });

      if (blockedUser) {
        return errorResponseWithoutData(
          res,
          messages.blockpostOwnerBlockedList,
          400
        );
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

    return errorResponseWithoutData(
      res,
      `${messages.errorAddingPost}: ${error}`,
      400
    );
  }
};

module.exports.getSinglePost = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return errorResponseWithoutData(res, messages.postIdNotProvided, 400);
    }

    const post = await Models.Post.findByPk(id, {
      attributes: {
        exclude: ["filePublicId"],
        include: [
          [
            Sequelize.fn(
              "COUNT",
              Sequelize.fn("DISTINCT", Sequelize.col("Likes.id"))
            ),
            "likesCount",
          ],
          [
            Sequelize.fn(
              "COUNT",
              Sequelize.fn("DISTINCT", Sequelize.col("Comments.id"))
            ),
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

    if (!post) {
      return errorResponseWithoutData(res, messages.postNotExists, 400);
    }

    const blockedUser = await Models.BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockedBy: req.user.id, blockedUser: post.dataValues.createdBy },
          { blockedBy: post.dataValues.createdBy, blockedUser: req.user.id },
        ],
      },
    });

    if (blockedUser) {
      return errorResponseWithoutData(res, messages.postOwnerBlocked, 400);
    }

    if (
      post.dataValues.status === "private" &&
      post.dataValues.createdBy !== req.user.id
    ) {
      const friend = await Models.Friend.findOne({
        where: {
          [Op.or]: [
            { userId: req.user.id, friendId: post.dataValues.createdBy },
            { userId: post.dataValues.createdBy, friendId: req.user.id },
          ],
        },
      });

      if (!friend) {
        return errorResponseWithoutData(
          res,
          messages.cantAccessPrivatePosts,
          400
        );
      }
    }

    let data = post.dataValues;

    if (
      post.dataValues.rootPostId !== null &&
      post.dataValues.rootPost === null
    ) {
      data.rootPost = "the original content is no longer available.";
    }

    if (
      post.dataValues.originalPostId !== null &&
      post.dataValues.originalPost === null
    ) {
      data.originalPost = "It's parent post is no longer available";
    }

    return successResponseData(res, data, 200, messages.getPostSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingPost}: ${error}`,
      400
    );
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
    return errorResponseWithoutData(
      res,
      `${messages.errorUpdatingPost}: ${error}`,
      400
    );
  }
};

module.exports.deletePost = async (req, res) => {
  let transaction;
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
          `Error deleting file from cloud storage: ${cloudinaryError}`,
          400
        );
      }
    }

    transaction = await sequelize.transaction();

    await Models.Like.destroy({
      where: { postId: id },
      transaction,
    });

    await Models.Comment.destroy({
      where: { postId: id },
      transaction,
    });

    await Models.Post.destroy({
      where: { id },
      transaction,
    });

    await transaction.commit();

    return successResponseWithoutData(res, messages.postDeleteSuccess, 200);
  } catch (error) {
    if (transaction) await transaction.rollback();

    console.log(error);
    return errorResponseWithoutData(
      res,
      `${messages.errorDeletePost}: ${error}`,
      400
    );
  }
};

module.exports.getPosts = async (req, res) => {
  try {
    const validationResponse = getPostsSchema(req.body, res);
    if (validationResponse !== false) return;

    const { profileId, pageId } = req.body;

    const { pageSize, page } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize) || 0;
    const limit = parseInt(pageSize || 10);

    if (profileId !== undefined) {
      const blockedUser = await Models.BlockedUser.findOne({
        where: {
          [Op.or]: [
            { blockedBy: req.user.id, blockedUser: profileId },
            { blockedBy: profileId, blockedUser: req.user.id },
          ],
        },
      });

      if (blockedUser) {
        return errorResponseWithoutData(res, messages.blockList, 400);
      }

      const friend = await Models.Friend.findOne({
        where: {
          [Op.or]: [
            { userId: req.user.id, friendId: profileId },
            { userId: profileId, friendId: req.user.id },
          ],
        },
      });

      if (friend === null) {
        const posts = await Models.User.findByPk(profileId, {
          attributes: ["id"],
          include: [
            {
              model: Models.Post,
              where: { pageId: null, status: "public" },
              attributes: {
                exclude: [
                  "createdBy",
                  "originalPostId",
                  "rootPostId",
                  "filePublicId",
                ],
                include: [
                  [
                    Sequelize.literal('COUNT(DISTINCT "Posts->Likes"."id")'),
                    "likesCount",
                  ],
                  [
                    Sequelize.literal('COUNT(DISTINCT "Posts->Comments"."id")'),
                    "commentsCount",
                  ],
                ],
              },
              include: [
                {
                  model: Models.Like,
                  as: "Likes",
                  attributes: [],
                  required: false,
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
              ],
              required: false,
            },
          ],
          order: [[Sequelize.col("Posts.createdAt"), "ASC"]],
          group: ["User.id", "Posts.id", "Posts.createdAt"],
          limit: limit,
          offset: offset,
          subQuery: false,
        });

        return successResponseData(res, posts, 200, messages.getPostSuccess);
      }

      const posts = await Models.User.findByPk(profileId, {
        attributes: ["id"],
        include: [
          {
            model: Models.Post,
            where: { pageId: null },
            attributes: {
              exclude: [
                "createdBy",
                "originalPostId",
                "rootPostId",
                "filePublicId",
              ],
              include: [
                [
                  Sequelize.literal('COUNT(DISTINCT "Posts->Likes"."id")'),
                  "likesCount",
                ],
                [
                  Sequelize.literal('COUNT(DISTINCT "Posts->Comments"."id")'),
                  "commentsCount",
                ],
              ],
            },
            include: [
              {
                model: Models.Like,
                as: "Likes",
                attributes: [],
                required: false,
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
            ],
            required: false,
          },
        ],
        order: [[Sequelize.col("Posts.createdAt"), "ASC"]],
        group: ["User.id", "Posts.id", "Posts.createdAt"],
        limit: limit,
        offset: offset,
        subQuery: false,
      });

      return successResponseData(res, posts, 200, messages.getPostSuccess);
    }

    if (pageId !== undefined) {
      const posts = await Models.Page.findByPk(pageId, {
        attributes: ["id"],
        include: [
          {
            model: Models.Post,
            as: "pagePosts",
            attributes: {
              exclude: [
                "createdBy",
                "originalPostId",
                "rootPostId",
                "status",
                "filePublicId",
              ],
              include: [
                [
                  Sequelize.literal('COUNT(DISTINCT "pagePosts->Likes"."id")'),
                  "likesCount",
                ],
                [
                  Sequelize.literal(
                    'COUNT(DISTINCT "pagePosts->Comments"."id")'
                  ),
                  "commentsCount",
                ],
              ],
            },
            include: [
              {
                model: Models.Like,
                as: "Likes",
                attributes: [],
                required: false,
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
            ],
            required: false,
          },
        ],
        order: [[Sequelize.col("pagePosts.createdAt"), "ASC"]],
        group: ["Page.id", "pagePosts.id", "pagePosts.createdAt"],
        limit: limit,
        offset: offset,
        subQuery: false,
      });

      return successResponseData(res, posts, 200, messages.getPostSuccess);
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingPost}: ${error}`,
      400
    );
  }
};

module.exports.getUserFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    const limit = parseInt(req.query.limit) || 50;
    const currentPage = parseInt(req.query.page) || 1;
    const offset = (currentPage - 1) * limit;

    const WEIGHTS = {
      FRIENDS_POST: 5,
      FRIENDS_COMMENT: 3,
      FRIENDS_LIKE: 2,
    };

    const userFriendships = await Models.Friend.findAll({
      where: {
        [Op.or]: [{ userId: userId }, { friendId: userId }],
        status: "confirm",
      },
    });

    const friendIds = userFriendships.map((friendship) =>
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );

    const basePosts = await Models.Post.findAll({
      where: {
        [Op.or]: [{ createdBy: { [Op.in]: friendIds } }],
        status: "public",
      },
      include: [
        {
          model: Models.User,
          attributes: ["id", "username", "profilePublicId"],
        },
        {
          model: Models.Like,
          attributes: ["id", "userId", "createdAt"],
        },
        {
          model: Models.Comment,
          attributes: ["id", "userId", "content", "createdAt"],
          include: [
            {
              model: Models.User,
              attributes: ["id", "username", "profilePublicId"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const scoredPosts = basePosts.map((post) => {
      let score = 0;

      if (friendIds.includes(post.createdBy)) {
        score += WEIGHTS.FRIENDS_POST;
      }

      const friendLikes = post.Likes
        ? post.Likes.filter((like) => friendIds.includes(like.userId)).length
        : 0;
      score += friendLikes * WEIGHTS.FRIENDS_LIKE;

      const friendComments = post.Comments
        ? post.Comments.filter((comment) => friendIds.includes(comment.userId))
            .length
        : 0;

      score += friendComments * WEIGHTS.FRIENDS_COMMENT;

      const postAge =
        (new Date() - new Date(post.createdAt)) / (1000 * 60 * 60); // Hours since post was created
      const timeDecay = Math.exp(-0.05 * postAge); // Simple exponential decay

      score = score * timeDecay;

      return {
        post: post,
        score: score,
      };
    });

    scoredPosts.sort((a, b) => b.score - a.score);

    const paginatedPosts = scoredPosts
      .slice(offset, offset + limit)
      .map((item) => item.post);

    const formattedPosts = paginatedPosts.map((post) => {
      const plainPost = post.get({ plain: true });
      return {
        ...plainPost,
        _score: scoredPosts.find((p) => p.post.id === post.id).score,
      };
    });

    return successResponseData(
      res,
      formattedPosts,
      200,
      messages.successUserFeed
    );
  } catch (error) {
    console.log(error);
    errorResponseWithoutData(res, messages.errorGettingUserFeed, 400);
  }
};
