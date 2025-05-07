const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BlockedUser extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: "blockedBy",
        as: "blocker",
      });
      this.belongsTo(models.User, {
        foreignKey: "blockedUser",
        as: "blocked",
      });
    }
  }

  BlockedUser.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      blockedBy: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
      blockedUser: {
        type: DataTypes.INTEGER,
        references: {
          model: "users",
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "BlockedUser",
      tableName: "blockedUsers",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["blockedBy", "blockedUser"],
          name: "blockedUser_unique_constraint",
        },
      ],
    }
  );

  return BlockedUser;
};
