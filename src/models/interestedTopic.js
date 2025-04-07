const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InterestedTopic extends Model {}

  InterestedTopic.init(
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
      modelName: "InterestedTopic",
      tableName: "interestedTopics",
      timestamps: true,
    }
  );

  return InterestedTopic;
};
