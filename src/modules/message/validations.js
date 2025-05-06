const joi = require("joi");
const { errorResponseWithoutData } = require("../../services/responses");
const { commonMessages } = require("../../services/commonMessages");

const getMessageHistorySchema = (body, res) => {
  try {
    const Schema = joi.object({
      receiverId: joi.number().required(),
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
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

const sendPostInChatSchema = (body, res) => {
  try {
    const Schema = joi.object({
      roomId: joi.number().required(),
      postId: joi.number().required(),
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
      `${commonMessages.errorWhileValidatingValues}: ${error}`,
      400
    );
  }
};

module.exports = {
  getMessageHistorySchema,
  sendPostInChatSchema,
};
