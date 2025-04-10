const { Model } = require("sequelize");
const {
  notificationType,
  entityType,
  notificationStatus,
} = require("../services/constants");

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {}

  Notification.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      // User who receives the notification
      recipientId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      // User who triggered the notification
      senderId: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "id" },
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(...notificationType),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.ENUM(...entityType),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...notificationStatus),
        defaultValue: notificationStatus[0],
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Notification",
      tableName: "notifications",
      timestamps: true,
    }
  );

  return Notification;
};
