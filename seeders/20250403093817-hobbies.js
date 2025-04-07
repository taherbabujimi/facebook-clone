"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "hobbies",
      [
        {
          name: "Hiking",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Camping",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Cycling",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Swimming",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Running",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Gardening",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("hobbies", null, {});
  },
};
