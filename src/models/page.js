const { Model } = require("sequelize");
const { pageStatus } = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class Page extends Model {
    static associate(models) {
      this.hasMany(models.Post, {
        foreignKey: "pageId",
        as: "pagePosts",
      });
    }
  }

  Page.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      pageName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: "pageCategories",
          key: "id",
        },
      },
      pageOwner: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profileImage: {
        type: DataTypes.STRING,
      },
      coverImage: {
        type: DataTypes.STRING,
      },
      pageStatus: {
        type: DataTypes.ENUM(...pageStatus),
        defaultValue: pageStatus[0],
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Page",
      tableName: "pages",
      timestamps: true,
    }
  );

  return Page;
};
