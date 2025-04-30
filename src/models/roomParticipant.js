const { Model } = require("sequelize");
const { roomParticipantStatus } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class RoomParticipant extends Model {
    static associate(models) {
      this.belongsTo(models.Room, {
        foreignKey: "roomId",
        as: "room",
      });
    }
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
      },
      lastReadMessageId: {
        type: DataTypes.INTEGER,
        references: {
          model: "messages",
          key: "id",
        },
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
