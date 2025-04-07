"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "interestedTopics",
      [
        {
          name: "Technology",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Health and Wellness",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Business and Finance",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Arts and Culture",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Travel and Adventure",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Gaming and Entertainment",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("interestedTopics", null, {});
  },
};
