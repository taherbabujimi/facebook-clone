"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blockedUsers", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      blockedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      blockedUser: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
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

    // Create the unique index separately
    await queryInterface.addIndex(
      "blockedUsers",
      ["blockedBy", "blockedUser"],
      {
        unique: true,
        name: "blockedUser_unique_constraint",
      }
    );
  },

  async down(queryInterface, Sequelize) {
    // First remove the index, then the table
    await queryInterface.removeIndex(
      "blockedUsers",
      "blockedUser_unique_constraint"
    );
    await queryInterface.dropTable("blockedUsers");
  },
};
