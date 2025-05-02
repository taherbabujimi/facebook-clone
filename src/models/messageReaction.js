const { Model } = require("sequelize");
const { reactionTypes } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class MessageReaction extends Model {}

  MessageReaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      messageId: {
        type: DataTypes.INTEGER,
        references: {
          model: "messages",
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
      reactionType: {
        type: DataTypes.ENUM(...reactionTypes),
        allowNull: false,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "MessageReaction",
      tableName: "messageReactions",
      timestamps: true,
    }
  );

  return MessageReaction;
};
