const joi = require("joi");
const { errorResponseWithoutData } = require("../../services/responses");
const { commonMessages } = require("../../services/commonMessages");
const { GENDER } = require("../user/constants");
const { countryCodes } = require("../../services/country");
const timezone = require("moment-timezone");

const userRegisterSchema = (body, res) => {
  try {
    const Schema = joi.object({
      username: joi.string().min(3).max(30).required(),
      email: joi.string().email().required(),
      password: joi.string().min(3).max(30).required(),
      dateOfBirth: joi.date().required(),
      gender: joi.string().valid(...GENDER),
      occupation: joi.number().required(),
      interestedTopics: joi.array().items(joi.number().required()).required(),
      hobbies: joi.array().items(joi.number().required()).required(),
      countryCode: joi
        .string()
        .valid(...countryCodes)
        .required(),
      timezone: joi
        .string()
        .valid(...timezone.tz.names())
        .required(),
      profilePublicId: joi.string(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      console.log(validationResult.error);

      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

const userLoginSchema = (body, res) => {
  try {
    const Schema = joi.object({
      email: joi.string().email().required(),
      password: joi.string().min(3).max(30).required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      console.log(validationResult.error);

      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

const forgotPasswordSchema = (body, res) => {
  try {
    const Schema = joi.object({
      email: joi.string().email().required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    return errorResponseWithoutData(
      res,
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

const resetPasswordSchema = (body, res) => {
  try {
    const Schema = joi.object({
      newPassword: joi.string().min(3).max(30).required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    return errorResponseWithoutData(
      res,
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

const searchUserSchema = (body, res) => {
  try {
    const Schema = joi.object({
      username: joi.string().min(3).max(30).required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

const updateUserProfileSchema = (body, res) => {
  try {
    const Schema = joi.object({
      username: joi.string().min(3).max(30),
      occupation: joi.number(),
      interestedTopics: joi.array().items(joi.number()),
      hobbies: joi.array().items(joi.number()),
      profilePublicId: joi.string(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

const blockUserSchema = (body, res) => {
  try {
    const Schema = joi.object({
      blockedUserId: joi.number().required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

const unblockUserSchema = (body, res) => {
  try {
    const Schema = joi.object({
      unblockUserId: joi.number().required(),
    });

    const validationResult = Schema.validate(body);

    if (validationResult.error) {
      return errorResponseWithoutData(
        res,
        `${commonMessages.errorWhileValidatingValues}: ${validationResult.error}`,
        400
      );
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      commonMessages.errorWhileValidatingValues,
      400
    );
  }
};

module.exports = {
  userRegisterSchema,
  userLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  searchUserSchema,
  updateUserProfileSchema,
  blockUserSchema,
  unblockUserSchema,
};
