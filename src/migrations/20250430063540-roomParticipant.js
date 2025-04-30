const { roomParticipantStatus } = require("../services/constants");

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("roomParticipants", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      roomId: {
        type: Sequelize.INTEGER,
        references: {
          model: "rooms",
          key: "id",
        },
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      joinedAt: {
        type: Sequelize.DATE,
      },
      lastReadMessageId: {
        type: Sequelize.INTEGER,
        references: {
          model: "messages",
          key: "id",
        },
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
      },
      status: {
        type: Sequelize.ENUM(...roomParticipantStatus),
        defaultValue: roomParticipantStatus[0],
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
    await queryInterface.dropTable("roomParticipants");
  },
};
