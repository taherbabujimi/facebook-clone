const { Op } = require("sequelize");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  sendRequestSchema,
  acceptRejectRequestSchema,
  getFriendsSchema,
} = require("./validations");
const Models = require("../../models/index");
const { cloudinary } = require("../../config/cloudinary");
const { requestTypes } = require("./constants");
const { notificationType, entityType } = require("../../services/constants");
const { sequelize } = require("../../models/index");
const WEIGHTS = {
  MUTUAL_FRIENDS: 8, // Weight per mutual friend
  SAME_COUNTRY: 3, // Weight for same country
  SHARED_HOBBY: 2, // Weight per shared hobby
  SHARED_INTEREST: 2, // Weight per shared interest
};

module.exports.sendFriendRequest = async (req, res) => {
  let transaction;
  try {
    const validationResponse = sendRequestSchema(req.body, res);
    if (validationResponse !== false) return;

    const { friendId } = req.body;

    if (friendId === req.user.id) {
      return errorResponseWithoutData(
        res,
        messages.cannotSendRequestToYourself,
        400
      );
    }

    const userInBlockList = await Models.BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockedBy: req.user.id, blockedUser: friendId },
          { blockedBy: friendId, blockedUser: req.user.id },
        ],
      },
    });

    if (userInBlockList) {
      return errorResponseWithoutData(res, messages.blockList, 400);
    }

    const alreadyFriend = await Models.Friend.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId, status: "confirm" },
          { friendId: req.user.id, userId: friendId, status: "confirm" },
        ],
      },
    });

    if (alreadyFriend) {
      return errorResponseWithoutData(res, messages.alreadyFriend, 400);
    }

    const requestExist = await Models.Friend.findOne({
      where: { friendId: req.user.id, userId: friendId },
    });

    if (requestExist) {
      return errorResponseWithoutData(res, messages.requestAlreadyExist, 400);
    }

    const user = await Models.User.findOne({
      where: { id: friendId, isVerified: true },
    });

    if (!user) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    transaction = await sequelize.transaction();

    const friendRequest = await Models.Friend.create(
      {
        userId: req.user.id,
        friendId,
      },
      { transaction }
    );

    if (!friendRequest) {
      await transaction.rollback();

      return errorResponseWithoutData(
        res,
        messages.errorSendingFriendRequest,
        400
      );
    }

    await Models.Notification.create(
      {
        recipientId: friendId,
        senderId: req.user.id,
        type: notificationType[0],
        entityType: entityType[0],
        entityId: friendRequest.id,
      },
      { transaction }
    );

    await transaction.commit();

    return successResponseData(
      res,
      friendRequest,
      200,
      messages.friendRequestSent
    );
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    if (
      error.original &&
      error.original.constraint === "custom_unique_constraint_friends"
    ) {
      return errorResponseWithoutData(res, messages.requestAlreadySent, 400);
    }

    return errorResponseWithoutData(
      res,
      `${messages.errorSendingFriendRequest}: ${error}`,
      400
    );
  }
};

module.exports.getFriendRequests = async (req, res) => {
  try {
    const { page, pageSize } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize) || 0;
    const limit = parseInt(pageSize || 8);

    const friendRequests = await Models.Friend.findAll({
      where: { friendId: req.user.id, status: "pending" },
      include: [{ model: Models.User, as: "User" }],
      limit,
      offset,
    });

    const data = [];

    friendRequests.map((item) => {
      data.push({
        username: item.dataValues.User.dataValues.username,
        url: cloudinary.url(item.dataValues.User.dataValues.profilePublicId),
        requestDateTime: item.dataValues.createdAt,
      });
    });

    if (!friendRequests) {
      return errorResponseWithoutData(res, messages.errorGettingRequests, 400);
    }

    return successResponseData(res, data, 200, messages.successGettingRequests);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingRequests}: ${error}`,
      400
    );
  }
};

module.exports.acceptRejectFriendRequest = async (req, res) => {
  let transaction;
  try {
    const validationResponse = acceptRejectRequestSchema(req.body, res);
    if (validationResponse !== false) return;

    const { friendId, requestType } = req.body;

    console.log(req.user.id, friendId, requestType);

    const request = await Models.Friend.findOne({
      where: { friendId: req.user.id, userId: friendId },
    });

    console.log(request);

    if (!request) {
      return errorResponseWithoutData(res, messages.requestNotFound, 400);
    }

    if (request.status === "confirm") {
      if (requestType === requestTypes[0]) {
        return errorResponseWithoutData(
          res,
          messages.requestAlreadyAccepted,
          400
        );
      } else {
        return errorResponseWithoutData(
          res,
          messages.cannotRejectAcceptedRequest,
          400
        );
      }
    }

    transaction = await sequelize.transaction();

    if (requestType === requestTypes[0]) {
      const user = await Models.User.findOne({
        where: { id: friendId },
      });

      if (!user) {
        return errorResponseWithoutData(res, messages.userNot, 400);
      }

      await Models.Friend.update(
        {
          status: "confirm",
        },
        { where: { friendId: req.user.id, userId: friendId } },
        { transaction }
      );

      await Models.Notification.create(
        {
          recipientId: friendId,
          senderId: req.user.id,
          type: notificationType[1],
          entityType: entityType[0],
          entityId: req.user.id,
        },
        { transaction }
      );

      await transaction.commit();

      return successResponseWithoutData(
        res,
        messages.requestAcceptSuccess,
        200
      );
    }

    await Models.Friend.destroy(
      {
        where: { userId: friendId, friendId: req.user.id },
      },
      { transaction }
    );

    await Models.Notification.create(
      {
        recipientId: friendId,
        senderId: req.user.id,
        type: notificationType[5],
        entityType: entityType[0],
        entityId: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    return successResponseWithoutData(res, messages.requestRejectSuccess, 200);
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorAcceptRejectRequest}: ${error}`,
      400
    );
  }
};

module.exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friends = await Models.Friend.findAll({
      where: {
        [Op.or]: [{ friendId: userId }, { userId: userId }],
        status: "confirm",
      },
      // attributes: [],
      include: [
        {
          model: Models.User,
          as: "User",
          required: false,
          attributes: [],
        },
        {
          model: Models.User,
          as: "FriendUser",
          required: false,
          attributes: [],
        },
      ],
      // Add a virtual column to determine which user is the friend
      attributes: {
        exclude: [
          "id",
          "userId",
          "friendId",
          "status",
          "createdAt",
          "updatedAt",
        ],
        include: [
          [
            Models.sequelize.literal(`CASE 
              WHEN "Friend"."userId" = ${userId} THEN "FriendUser"."id"
              ELSE "User"."id" 
            END`),
            "id",
          ],
          [
            Models.sequelize.literal(`CASE 
              WHEN "Friend"."userId" = ${userId} THEN "FriendUser"."username"
              ELSE "User"."username" 
            END`),
            "username",
          ],
          [
            Models.sequelize.literal(`CASE 
              WHEN "Friend"."userId" = ${userId} THEN "FriendUser"."email"
              ELSE "User"."email" 
            END`),
            "email",
          ],
          // You can add more fields as needed
        ],
      },
    });

    console.log("FRIENDS: ", friends);

    if (!friends) {
      return errorResponseWithoutData(res, messages.errorGettingFriends, 400);
    }

    return successResponseData(
      res,
      friends,
      200,
      messages.successGettingFriends
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingFriends}: ${error}`,
      400
    );
  }
};

module.exports.getRecommendedFriends = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is attached by auth middleware

    const limit = parseInt(req.query.limit) || 10; // number of items per page
    const currentPage = parseInt(req.query.page) || 1; // current page number (starts from 1)
    const offset = (currentPage - 1) * limit; // calculate the offset

    const userBlockedBy = await Models.BlockedUser.findAll({
      where: {
        [Op.or]: [{ blockedBy: req.user.id }, { blockedUser: req.user.id }],
      },
    });

    const blockedBy = userBlockedBy.map((item) => {
      if (item.dataValues.blockedBy === req.user.id) {
        return item.dataValues.blockedUser;
      }

      return item.dataValues.blockedBy;
    });

    // Get existing friends and friend requests
    const existingConnections = await Models.Friend.findAll({
      where: {
        [Op.or]: [{ userId: userId }, { friendId: userId }],
      },
      attributes: ["userId", "friendId"],
    });

    // Create a set of users to exclude (current user + existing connections)
    const excludeUserIds = new Set([userId]);
    existingConnections.forEach((conn) => {
      excludeUserIds.add(conn.userId);
      excludeUserIds.add(conn.friendId);
    });

    // Get all potential users
    const potentialFriends = await Models.User.findAll({
      where: {
        id: { [Op.notIn]: Array.from(excludeUserIds) },
        isVerified: true,
      },
      attributes: [
        "id",
        "username",
        "countryCode",
        "interestedTopics",
        "hobbies",
        "profilePublicId",
      ],
      order: [sequelize.literal("RANDOM()")], // Use PostgreSQL's RANDOM() function to randomize the order
      limit: 100, // Fetch 100 random users
    });

    // Get mutual friends for each potential friend
    const mutualFriendsMap = await getMutualFriends(
      userId,
      potentialFriends.map((user) => user.id)
    );

    // Score each potential friend
    const scoredRecommendations = potentialFriends.map((user) => {
      if (blockedBy.includes(user.dataValues.id)) {
        return;
      }

      const scoreData = calculateRecommendationScore(
        req.user,
        user,
        mutualFriendsMap.get(user.id) || 0
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          profileURL: cloudinary.url(user.profilePublicId),
          countryCode: user.countryCode,
        },
        scoreData,
        mutualFriendsCount: mutualFriendsMap.get(user.id) || 0,
      };
    });

    // Sort by score (highest first) and limit results
    const recommendations = scoredRecommendations
      .sort((a, b) => b.scoreData.score - a.scoreData.score)
      .slice(offset, offset + limit);

    return successResponseData(
      res,
      recommendations,
      200,
      messages.fetchedRecommendedFriendSuccess
    );
  } catch (error) {
    console.error("Friend recommendation error:", error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingRecommendations}: ${error}`,
      400
    );
  }
};

async function getMutualFriends(userId, potentialFriendIds) {
  // Get all the current user's friends
  const userFriends = await Models.Friend.findAll({
    where: {
      [Op.or]: [
        { userId: userId, status: "confirm" },
        { friendId: userId, status: "confirm" },
      ],
    },
    attributes: ["userId", "friendId"],
  });

  // Create a set of the user's friends
  const userFriendIds = new Set();
  userFriends.forEach((friendship) => {
    const friendId =
      friendship.userId === userId ? friendship.friendId : friendship.userId;
    userFriendIds.add(friendId);
  });

  // Get all friendships involving potential friends
  const potentialFriendships = await Models.Friend.findAll({
    where: {
      [Op.or]: [
        { userId: { [Op.in]: potentialFriendIds }, status: "confirm" },
        { friendId: { [Op.in]: potentialFriendIds }, status: "confirm" },
      ],
    },
    attributes: ["userId", "friendId"],
  });

  // Calculate mutual friends count for each potential friend
  const mutualFriendsMap = new Map();

  potentialFriendships.forEach((friendship) => {
    const potentialFriendId = potentialFriendIds.includes(friendship.userId)
      ? friendship.userId
      : friendship.friendId;

    const theirFriendId =
      friendship.userId === potentialFriendId
        ? friendship.friendId
        : friendship.userId;

    if (userFriendIds.has(theirFriendId)) {
      // Increment mutual friend count
      mutualFriendsMap.set(
        potentialFriendId,
        (mutualFriendsMap.get(potentialFriendId) || 0) + 1
      );
    }
  });

  return mutualFriendsMap;
}

function calculateRecommendationScore(
  currentUser,
  potentialFriend,
  mutualFriendsCount
) {
  let score = 0;
  let noOfMutualHobbies = 0;
  let noOfMutualInterests = 0;

  // Add score for mutual friends
  score += mutualFriendsCount * WEIGHTS.MUTUAL_FRIENDS;

  // Add score for same country
  if (currentUser.countryCode === potentialFriend.countryCode) {
    score += WEIGHTS.SAME_COUNTRY;
  }

  // Add score for shared hobbies
  const sharedHobbies = currentUser.hobbies.filter((hobby) =>
    potentialFriend.hobbies.includes(hobby)
  );

  noOfMutualHobbies = sharedHobbies.length;
  score += sharedHobbies.length * WEIGHTS.SHARED_HOBBY;

  // Add score for shared interests
  const sharedInterests = currentUser.interestedTopics.filter((interest) =>
    potentialFriend.interestedTopics.includes(interest)
  );

  noOfMutualInterests = sharedInterests.length;
  score += sharedInterests.length * WEIGHTS.SHARED_INTEREST;

  return { score: score, noOfMutualHobbies, noOfMutualInterests };
}
