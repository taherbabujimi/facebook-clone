"use strict";
const { requestStatus } = require("../services/constants");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("friends", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      friendId: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
      },
      status: {
        type: Sequelize.ENUM(requestStatus),
        defaultValue: requestStatus[0],
        allowNull: false,
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

    await queryInterface.addConstraint("friends", {
      fields: ["userId", "friendId"],
      type: "unique",
      name: "custom_unique_constraint_friends",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("friends");
  },
};
