const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PageCategory extends Model {
    static associate(models) {}
  }

  PageCategory.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      categoryName: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PageCategory",
      tableName: "pageCategories",
      timestamps: true,
    }
  );

  return PageCategory;
};
