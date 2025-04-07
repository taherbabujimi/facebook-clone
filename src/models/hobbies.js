const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hobbies extends Model {}

  Hobbies.init(
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
      modelName: "Hobbies",
      tableName: "hobbies",
      timestamps: true,
    }
  );

  return Hobbies;
};
