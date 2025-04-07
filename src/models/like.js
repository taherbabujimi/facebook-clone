const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      this.belongsTo(models.Post, {
        foreignKey: "postId",
      });
    }
  }

  Like.init(
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
      postId: {
        type: DataTypes.INTEGER,
        references: { model: "posts", key: "id" },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Like",
      tableName: "likes",
      timestamps: true,
    }
  );

  return Like;
};
