"use strict";
const { STATUS } = require("../modules/post/constants");
const { FILE_TYPE } = require("../modules/post/constants");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      filePublicId: {
        type: Sequelize.STRING,
        unique: true,
      },
      fileResourceType: {
        type: Sequelize.ENUM(...FILE_TYPE),
      },
      status: {
        type: Sequelize.ENUM(...STATUS),
        allowNull: false,
      },
      caption: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING,
      },
      originalPostId: {
        type: Sequelize.INTEGER,
        // references: { model: "posts", key: "id" },
      },
      rootPostId: {
        type: Sequelize.INTEGER,
        // references: { model: "posts", key: "id" },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("posts");
  },
};
