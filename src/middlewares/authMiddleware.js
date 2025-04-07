"use strict";

const jwt = require("jsonwebtoken");
const {
  errorResponseWithoutData,
  errorResponseData,
} = require("../services/responses");
const Models = require("../models/index");
const { commonMessages } = require("../services/commonMessages");

module.exports = {
  async verifyJWT(req, res, next) {
    try {
      const token = req.header("Authorization").replace("Bearer ", "");

      if (!token) {
        return errorResponseWithoutData(res, commonMessages.badRequest, 400);
      }

      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await Models.User.findOne({
        where: { email: decodedToken.email },
      });

      if (!user) {
        return errorResponseWithoutData(res, commonMessages.invalidToken, 400);
      }

      if (user.isVerified === false) {
        return errorResponseWithoutData(
          res,
          commonMessages.userNotVerified,
          400
        );
      }

      req.user = user;

      next();
    } catch (error) {
      console.log(error);
      return errorResponseData(res, commonMessages.invalidToken, error);
    }
  },
};
