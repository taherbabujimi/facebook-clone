const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
  successResponseWithoutData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { createPageSchema, deletePageSchema } = require("./validations");
const { getChannel } = require("../../config/queue-config");
const { Op } = require("sequelize");

module.exports.createPage = async (req, res) => {
  try {
    const validationResponse = createPageSchema(req.body, res);

    if (validationResponse !== false) return;

    const {
      pageName,
      categoryId,
      description,
      profileImage,
      coverImage,
      pageStatus,
    } = req.body;

    const categoryExists = await Models.PageCategory.findByPk(categoryId);

    if (!categoryExists) {
      return errorResponseWithoutData(res, messages.categoryNotExists, 400);
    }

    const page = await Models.Page.create({
      pageName,
      categoryId,
      pageOwner: req.user.id,
      description,
      profileImage,
      coverImage,
      pageStatus,
    });

    return successResponseData(res, page, 200, messages.pageCreateSuccess);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorCreatePage}:${error}`,
      400
    );
  }
};

module.exports.getPage = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return errorResponseWithoutData(res, messages.pageIdNotProvided, 400);
    }

    const page = await Models.Page.findByPk(id);

    if (!page) {
      return errorResponseWithoutData(res, messages.pageNotExists, 400);
    }

    const blockedUser = await Models.BlockedUser.findOne({
      where: {
        [Op.or]: [
          { blockedBy: req.user.id, blockedUser: page.dataValues.pageOwner },
          {
            blockedBy: page.dataValues.pageOwner,
            blockedUser: req.user.id,
          },
        ],
      },
    });

    if (blockedUser) {
      return errorResponseWithoutData(res, messages.blockedUser, 400);
    }

    return successResponseData(res, page, 200, messages.successFetchPage);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorGettingPage}: ${error}`,
      400
    );
  }
};

module.exports.deletePage = async (req, res) => {
  try {
    const validationResponse = deletePageSchema(req.body, res);
    if (validationResponse !== false) return;

    const { pageId } = req.body;

    const pageExists = await Models.Page.findByPk(pageId);

    if (!pageExists) {
      return errorResponseWithoutData(res, messages.pageNotExists, 400);
    }

    if (pageExists.pageOwner !== req.user.id) {
      return errorResponseWithoutData(res, messages.pageNotYours, 400);
    }

    const channel = getChannel();

    if (channel) {
      await channel.sendToQueue(
        "facebook-notification-queue",
        Buffer.from(JSON.stringify(pageExists.dataValues))
      );

      console.log("Message sent to the queue.");
    } else {
      console.log("RabbitMQ channel is not connected.");
    }

    return successResponseWithoutData(res, messages.pageWillBeDeleted, 200);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(
      res,
      `${messages.errorDeletePage}: ${error}`,
      400
    );
  }
};
