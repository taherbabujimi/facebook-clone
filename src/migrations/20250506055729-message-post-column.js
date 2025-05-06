"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("messages", "postId", {
      type: Sequelize.INTEGER,
      references: {
        model: "posts",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("messages", "postId");
  },
};
