const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { followUnfollowUserSchema } = require("./validations");
const Models = require("../../models/index");

module.exports.followUnfollowUser = async (req, res) => {
  try {
    const validationResponse = followUnfollowUserSchema(req.body, res);
    if (validationResponse !== false) return;

    const { followingId } = req.body;

    if (followingId === req.user.id) {
      return errorResponseWithoutData(res, messages.cannotFollowYourself, 400);
    }

    const alreadyFollowed = await Models.Follower.findOne({
      where: {
        followerId: req.user.id,
        followingId,
      },
    });

    if (alreadyFollowed) {
      await Models.Follower.destroy({
        where: {
          followerId: req.user.id,
          followingId,
        },
      });

      return successResponseWithoutData(res, messages.successUnfollowed, 200);
    }

    const follower = await Models.Follower.create({
      followerId: req.user.id,
      followingId,
    });

    if (!follower) {
      return errorResponseWithoutData(
        res,
        messages.errorFollowUnfollowUser,
        400
      );
    }

    return successResponseData(res, follower, 200, messages.successFollowed);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorFollowUnfollowUser, 400);
  }
};

module.exports.getFollowers = async (req, res) => {
  try {
    const followers = await Models.Follower.findAll({
      where: {
        followingId: req.user.id,
      },
      include: {
        model: Models.User,
        as: "Followers",
        attributes: ["id", "username", "email"],
      },
      attributes: [],
    });

    if (!followers) {
      return errorResponseWithoutData(res, messages.errorGettingFollowers, 400);
    }

    return successResponseData(
      res,
      followers,
      200,
      messages.successGettingFollowers
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorGettingFollowers, 400);
  }
};

module.exports.getFollowings = async (req, res) => {
  try {
    const followings = await Models.Follower.findAll({
      where: {
        followerId: req.user.id,
      },
      include: {
        model: Models.User,
        as: "Followings",
        attributes: ["id", "username", "email"],
      },
      attributes: [],
    });

    if (!followings) {
      return errorResponseWithoutData(
        res,
        messages.errorGettingFollowings,
        400
      );
    }

    return successResponseData(
      res,
      followings,
      200,
      messages.successGettingFollowings
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorGettingFollowings, 400);
  }
};
