const { Model } = require("sequelize");
const { STATUS } = require("../modules/post/constants");

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      this.hasMany(models.Like, {
        foreignKey: "postId",
      });
    }
  }

  Post.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      filePublicId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM(...STATUS),
        allowNull: false,
      },
      caption: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Post",
      tableName: "posts",
      timestamps: true,
    }
  );

  return Post;
};
