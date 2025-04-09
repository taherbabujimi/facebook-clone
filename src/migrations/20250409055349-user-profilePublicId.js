"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "profilePublicId", {
      type: Sequelize.STRING,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "profilePublicId");
  },
};
