const joi = require("joi");
const { commonMessages } = require("../../services/commonMessages");
const { errorResponseWithoutData } = require("../../services/responses");

const sendAcceptRejectRequestSchema = (body, res) => {
  try {
    const Schema = joi.object({
      friendId: joi.number().required(),
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
  sendAcceptRejectRequestSchema,
};
