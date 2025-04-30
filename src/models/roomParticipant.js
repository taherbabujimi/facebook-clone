const { Model } = require("sequelize");
const { roomParticipantStatus } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class RoomParticipant extends Model {
    static associate() {}
  }

  RoomParticipant.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      roomId: {
        type: DataTypes.INTEGER,
        references: {
          model: "rooms",
          key: "id",
        },
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        references: {
          model: "messages",
          key: "id",
        },
        allowNull: false,
      },
      isAdmin: {
        type: DataTypes.BOOLEAN,
      },
      status: {
        type: DataTypes.ENUM(...roomParticipantStatus),
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "RoomParticipant",
      tableName: "roomParticipants",
    }
  );

  return RoomParticipant;
};
