"use strict";
const date = new Date();

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "pageCategories",
      [
        {
          categoryName: "Local Business",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Company",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Brand",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Artist",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Entertainment",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Community",
          createdAt: date,
          updatedAt: date,
        },
        {
          categoryName: "Public Figure",
          createdAt: date,
          updatedAt: date,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("pageCategories", null, {});
  },
};
