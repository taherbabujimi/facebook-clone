const path = require("path");
const pug = require("pug");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { cloudinary } = require("../../config/cloudinary");
const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const {
  userRegisterSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  searchUserSchema,
  updateUserProfileSchema,
} = require("./validations");
const { countries } = require("../../services/country");
const { generateForgotPasswordToken } = require("./helpers");
const {
  link,
  forgotPasswordSubject,
  verifyEmailLink,
  verifyEmailSubject,
  userLoginLink,
} = require("./constants");
const { emailTransport } = require("../../services/mailTransport");
const { client } = require("../../config/redis");

module.exports.registerUser = async (req, res) => {
  try {
    const validationResponse = userRegisterSchema(req.body, res);
    if (validationResponse !== false) return;

    const {
      username,
      email,
      password,
      dateOfBirth,
      gender,
      occupation,
      interestedTopics,
      hobbies,
      countryCode,
      timezone,
      profilePublicId,
    } = req.body;

    const userExists = await Models.User.findOne({
      where: { email },
    });

    if (userExists) {
      return errorResponseWithoutData(res, messages.userExists, 400);
    }

    const occupationExists = await Models.Occupation.findByPk(occupation);

    if (!occupationExists) {
      return errorResponseWithoutData(res, messages.occupationNotFound, 400);
    }

    const interestedTopicsExists = await Models.InterestedTopic.count({
      where: { id: interestedTopics },
    });

    if (interestedTopicsExists < interestedTopics.length) {
      return errorResponseWithoutData(
        res,
        messages.interestedTopicsNotFound,
        400
      );
    }

    const hobbiesExists = await Models.Hobbies.count({
      where: { id: hobbies },
    });

    if (hobbiesExists < hobbies.length) {
      return errorResponseWithoutData(res, messages.hobbiesNotFound, 400);
    }

    const region = countries.find(
      (item) => item.countryCode === countryCode
    )?.countryRegion;

    const user = await Models.User.create({
      username,
      email,
      password,
      dateOfBirth,
      gender,
      occupation,
      interestedTopics,
      hobbies,
      region,
      countryCode,
      timezone,
      profilePublicId,
    });

    successResponseData(res, user, 200, messages.verifyEmailSentSuccess);

    const verifyEmailToken = await user.generateEmailVerificationToken();

    const url = `${verifyEmailLink}${verifyEmailToken}`;

    const html = pug.renderFile(
      path.join(__dirname, "./view/emailVerify.pug"),
      { url }
    );

    await emailTransport(
      process.env.ADMIN_EMAIL,
      email,
      verifyEmailSubject,
      html
    );
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorRegisterUser}: ${error}`,
      400
    );
  }
};

module.exports.verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return errorResponseWithoutData(
        res,
        messages.invalidVerifyEmailRequest,
        400
      );
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.EMAIL_VERIFY_TOKEN_SECRET
    );

    if (!decodedToken) {
      return errorResponseWithoutData(
        res,
        messages.invalidVerifyEmailRequest,
        400
      );
    }

    const user = await Models.User.findOne({
      where: { email: decodedToken.email },
    });

    if (user.isVerified === true) {
      const html = pug.renderFile(
        path.join(__dirname, "./view/emailAlreadyVerified.pug"),
        { userLoginLink }
      );

      res.set("Content-Type", "Text/html");
      return res.send(html);
    }

    user.set("isVerified", true);
    await user.save();

    const html = pug.renderFile(
      path.join(__dirname, "./view/emailVerifySuccess.pug"),
      { userLoginLink }
    );

    res.set("Content-Type", "Text/html");

    return res.send(html);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(
      res,
      `${messages.errorVerifyingEmail}: ${error}`,
      400
    );
  }
};

module.exports.userLogin = async (req, res) => {
  try {
    const validationResponse = userLoginSchema(req.body, res);
    if (validationResponse !== false) return;

    const { email, password } = req.body;

    const user = await Models.User.findOne({
      where: { email },
      attributes: ["username", "email", "password", "isVerified", "id"],
    });

    if (!user) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    if (user.isVerified === false) {
      return errorResponseWithoutData(res, messages.userNotVerified, 400);
    }

    const isPasswordValid = await user.validPassword(password);

    if (!isPasswordValid) {
      return errorResponseWithoutData(res, messages.incorrectCredentials, 400);
    }

    const accessToken = await user.generateAccessToken();

    await res.cookie("auth_token", accessToken, {
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "Lax", // Allow cookies for same-origin and some cross-origin requests
      path: "/", // Make the cookie accessible to all routes
      maxAge: 1 * 600 * 1000,
    });

    const userData = {
      username: user.username,
      email: user.email,
    };

    return successResponseData(res, userData, 200, messages.userLoginSuccess, {
      token: accessToken,
    });
  } catch (error) {
    console.log(error);

    errorResponseWithoutData(res, `${messages.errorLoginUser}: ${error}`, 400);
  }
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const validationResponse = forgotPasswordSchema(req.body, res);
    if (validationResponse !== false) return;

    const { email } = req.body;

    const userExists = await Models.User.findOne({ where: { email } });

    if (!userExists) {
      return errorResponseWithoutData(res, messages.userNotExists, 400);
    }

    if (userExists.isVerified === false) {
      return errorResponseWithoutData(res, messages.userNotVerified, 400);
    }

    const key = `forgot_password:${email}`;

    try {
      const attempts = await client.incr(key);

      if (attempts === 1) {
        await client.expire(key, 3600); // 1 hour window
      }

      const MAX_ATTEMPTS = 3;

      if (attempts > MAX_ATTEMPTS) {
        const timeRemaining = await client.ttl(key);
        console.log(`Rate limit exceeded for ${email}. Attempt ${attempts}`);

        return errorResponseWithoutData(
          res,
          `Too many password reset attempts. Please try again in ${Math.ceil(
            timeRemaining / 60
          )} minutes.`,
          400
        );
      }

      console.log(`Password reset requested for ${email}. Attempt ${attempts}`);
    } catch (redisError) {
      console.error("Redis rate limiting error:", redisError);
    }

    const forgotPasswordToken = await generateForgotPasswordToken(email);
    const url = `${link}${forgotPasswordToken}`;

    const html = pug.renderFile(
      path.join(__dirname, "./view/forgotPassword.pug"),
      { url }
    );

    await emailTransport(
      process.env.ADMIN_EMAIL,
      email,
      forgotPasswordSubject,
      html
    );

    return successResponseWithoutData(res, messages.resetPasswordMail, 200, {
      token: forgotPasswordToken,
    });
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorForgotPassword}: ${error}`,
      400
    );
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return errorResponseWithoutData(res, messages.invalidRequest, 400);
    }

    const decodedToken = await jwt.verify(
      token,
      process.env.FORGOTPASSWORD_TOKEN_SECRET
    );

    if (!decodedToken) {
      return errorResponseWithoutData(res, messages.invalidRequest, 400);
    }

    const user = await Models.User.findOne({
      where: { email: decodedToken.email },
    });

    if (!user) {
      return errorResponseWithoutData(
        res,
        messages.somethingWentWrongResetingPassword,
        400
      );
    }

    if (user.isVerified === false) {
      return errorResponseWithoutData(res, messages.userNotVerified, 400);
    }

    const validationResponse = resetPasswordSchema(req.body, res);
    if (validationResponse !== false) return;

    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.set("password", hashedPassword);
    await user.save();

    return successResponseWithoutData(res, messages.resetPasswordSuccess, 200);
  } catch (error) {
    console.log(error);
    return errorResponseWithoutData(
      res,
      `${messages.somethingWentWrongResetingPassword}: ${error}`,
      400
    );
  }
};

module.exports.searchUser = async (req, res) => {
  try {
    const { page, pageSize } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize) || 0;
    const limit = parseInt(pageSize || 8);

    const validationResponse = searchUserSchema(req.body, res);
    if (validationResponse !== false) return;

    const { username } = req.body;

    const user = await Models.User.findAll({
      where: { username: { [Op.like]: `%${username}%` }, isVerified: true },
      attributes: ["username", "profilePublicId"],
      limit,
      offset,
    });

    const data = [];

    user.map(async (item) => {
      let profilePic;

      if (item.dataValues.profilePublicId === null) {
        profilePic = null;
      } else {
        profilePic = cloudinary.url(item.dataValues.profilePublicId);
      }

      data.push({
        username: item.dataValues.username,
        profilePic,
      });
    });

    return successResponseData(res, data, 200, messages.userFoundSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorSearchUser}: ${error}`,
      400
    );
  }
};

module.exports.updateUserProfile = async (req, res) => {
  try {
    const validationResponse = updateUserProfileSchema(req.body, res);
    if (validationResponse !== false) return;

    const { username, occupation, interestedTopics, hobbies, profilePublicId } =
      req.body;

    const occupationExists = await Models.Occupation.findByPk(occupation);

    if (!occupationExists) {
      return errorResponseWithoutData(res, messages.occupationNotFound, 400);
    }

    if (interestedTopics !== undefined) {
      const interestedTopicsExists = await Models.InterestedTopic.count({
        where: { id: interestedTopics },
      });

      if (interestedTopicsExists < interestedTopics.length) {
        return errorResponseWithoutData(
          res,
          messages.interestedTopicsNotFound,
          400
        );
      }
    }

    if (hobbies !== undefined) {
      const hobbiesExists = await Models.Hobbies.count({
        where: { id: hobbies },
      });

      if (hobbiesExists < hobbies.length) {
        return errorResponseWithoutData(res, messages.hobbiesNotFound, 400);
      }
    }

    if (profilePublicId !== undefined) {
      if (req.user.profilePublicId !== null) {
        await cloudinary.uploader.destroy(req.user.profilePublicId, {
          resource_type: "image",
        });
      }
    }

    const user = await Models.User.update(
      {
        username,
        occupation,
        interestedTopics,
        hobbies,
        profilePublicId,
      },
      {
        where: { id: req.user.id },
      }
    );

    return successResponseData(res, user, 200, messages.updateUserSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorUpdateUser}: ${error}`,
      400
    );
  }
};
