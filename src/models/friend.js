const { Model } = require("sequelize");
const { requestStatus } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class Friend extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "userId",
        as: "User",
      });
      this.belongsTo(models.User, {
        foreignKey: "friendId",
        as: "Friend",
      });
    }
  }

  Friend.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      friendId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
      },
      status: {
        type: DataTypes.ENUM(...requestStatus),
        defaultValue: requestStatus[0],
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Friend",
      tableName: "friends",
      timestamps: true,
    }
  );

  return Friend;
};
