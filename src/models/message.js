const { Model } = require("sequelize");
const { messageStatus } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "sender",
      });

      this.belongsTo(models.Room, {
        foreignKey: "roomId",
        as: "room",
      });

      this.hasMany(models.MessageReaction, {
        foreignKey: "messageId",
        as: "reactions",
      });

      this.belongsTo(models.Post, {
        foreignKey: "postId",
        as: "post",
      });
    }
  }

  Message.init(
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
      senderId: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...messageStatus),
        defaultValue: messageStatus[0],
      },
      postId: {
        type: DataTypes.INTEGER,
        references: {
          model: "posts",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      timestamps: true,
    }
  );

  return Message;
};
