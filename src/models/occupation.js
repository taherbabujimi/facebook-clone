const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Occupation extends Model {}

  Occupation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Occupation",
      tableName: "occupations",
      timestamps: true,
    }
  );

  return Occupation;
};
