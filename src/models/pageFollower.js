const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PageFollower extends Model {}

  PageFollower.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      pageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "pages",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "PageFollower",
      tableName: "pageFollowers",
      timestamps: true,
    }
  );

  return PageFollower;
};
