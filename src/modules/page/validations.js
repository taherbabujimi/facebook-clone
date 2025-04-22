const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");
const { pageStatus } = require("../../services/constants");

const createPageSchema = (body, res) => {
  try {
    const Schema = joi.object({
      pageName: joi.string().min(3).max(30).required(),
      categoryId: joi.number().required(),
      description: joi.string().min(3).max(500).required(),
      profileImage: joi.string(),
      coverImage: joi.string(),
      pageStatus: joi.string().valid(...pageStatus),
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

const deletePageSchema = (body, res) => {
  try {
    const Schema = joi.object({
      pageId: joi.number().required(),
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

module.exports = { createPageSchema, deletePageSchema };
