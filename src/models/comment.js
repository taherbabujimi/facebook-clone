const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    static associate(models) {
      this.belongsTo(models.Post, { foreignKey: "postId" });
      this.belongsTo(models.User, { foreignKey: "userId" });
      this.belongsTo(models.Comment, {
        foreignKey: "parentId",
        as: "Parent",
      });
      this.hasMany(models.Comment, {
        foreignKey: "parentId",
        as: "Replies",
      });
    }
  }

  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      postId: {
        type: DataTypes.INTEGER,
        references: { model: "posts", key: "id" },
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        references: { model: "comments", key: "id" },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Comment",
      tableName: "comments",
      timestamps: true,
      indexes: [
        { fields: ["postId"] },
        { fields: ["parentId"] },
        { fields: ["userId"] },
      ],
    }
  );

  return Comment;
};
