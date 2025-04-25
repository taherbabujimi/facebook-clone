const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Follower extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "followerId",
        as: "Followers",
      });
      this.belongsTo(models.User, {
        foreignKey: "followingId",
        as: "Followings",
      });
    }
  }

  Follower.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      followingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Follower",
      tableName: "followers",
      timestamps: true,
    }
  );

  return Follower;
};
