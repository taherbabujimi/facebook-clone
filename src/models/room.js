const { Model } = require("sequelize");
const { roomType } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    static associate(models) {
      this.hasMany(models.RoomParticipant, {
        foreignKey: "roomId",
        as: "participants",
      });
    }
  }

  Room.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.ENUM(...roomType),
        defaultValue: roomType[0],
        allowNull: false,
      },
      lastMessageId: {
        type: DataTypes.INTEGER,
        references: {
          model: "messages",
          key: "id",
        },
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "Room",
      tableName: "rooms",
    }
  );

  return Room;
};
