"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "occupations",
      [
        {
          name: "Working Professional",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Student",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Entrepreneur/Business Owner",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Retired",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Homemaker",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Freelancer/Consultant",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Artist/Creator",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
        {
          name: "Other",
          createdAt: Sequelize.fn("NOW"),
          updatedAt: Sequelize.fn("NOW"),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("occupations", null, {});
  },
};
