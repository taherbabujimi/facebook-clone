const Models = require("../../models/index");
const {
  errorResponseWithoutData,
  successResponseData,
} = require("../../services/responses");
const { messages } = require("./messages");
const { createPageSchema } = require("./validations");

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

    return errorResponseWithoutData(res, messages.errorCreatePage, 400);
  }
};

module.exports.getPage = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return errorResponseWithoutData(res, messages.pageIdNotProvided, 400);
    }

    const page = await Models.Page.findByPk(id, {
      include: [
        {
          model: Models.Post,
          as: "pagePosts",
        },
      ],
    });

    if (!page) {
      return errorResponseWithoutData(res, messages.pageNotExists, 400);
    }

    return successResponseData(res, page, 200, messages.successFetchPage);
  } catch (error) {
    console.log(error);

    return errorResponseWithoutData(res, messages.errorGettingPage, 400);
  }
};
