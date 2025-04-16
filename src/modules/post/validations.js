const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");
const { STATUS } = require("./constants");

const addPostSchema = (body, res) => {
  try {
    const Schema = joi.object({
      originalPostId: joi.number(),
      filePublicId: joi.alternatives().conditional("originalPostId", {
        is: joi.exist(),
        then: joi.forbidden(),
        otherwise: joi.string().min(3).required(),
      }),
      fileResourceType: joi.alternatives().conditional("originalPostId", {
        is: joi.exist(),
        then: joi.forbidden(),
        otherwise: joi.string().valid("image", "video").required(),
      }),
      status: joi.string().valid(...STATUS),
      caption: joi.string().max(300),
      location: joi.string(),
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

const updatePostSchema = (body, res) => {
  try {
    const Schema = joi.object({
      status: joi.string().valid(...STATUS),
      caption: joi.string().max(300),
      location: joi.string(),
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

module.exports = {
  addPostSchema,
  updatePostSchema,
};
