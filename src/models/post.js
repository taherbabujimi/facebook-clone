const { Model } = require("sequelize");
const { STATUS } = require("../modules/post/constants");
const { FILE_TYPE } = require("../modules/post/constants");

module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    static associate(models) {
      this.hasMany(models.Like, {
        foreignKey: "postId",
      });

      this.hasMany(models.Comment, {
        foreignKey: "postId",
      });

      this.hasMany(models.Post, {
        foreignKey: "originalPostId",
        as: "reposts",
      });

      this.belongsTo(models.Post, {
        foreignKey: "originalPostId",
        as: "originalPost",
      });

      this.hasMany(models.Post, {
        foreignKey: "rootPostId",
        as: "allReposts",
      });

      this.belongsTo(models.Post, {
        foreignKey: "rootPostId",
        as: "rootPost",
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
        unique: true,
      },
      fileResourceType: {
        type: DataTypes.ENUM(...FILE_TYPE),
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
      },
      originalPostId: {
        type: DataTypes.INTEGER,
      },
      rootPostId: {
        type: DataTypes.INTEGER,
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
