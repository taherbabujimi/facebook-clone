"use strict";
const { Model } = require("sequelize");
const { GENDER } = require("../modules/user/constants");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      this.hasMany(models.Post, { foreignKey: "createdBy" });
      this.hasMany(models.Comment, { foreignKey: "userId" });
      this.hasMany(models.Like, { foreignKey: "userId" });
      this.hasMany(models.Friend, { foreignKey: "userId", as: "Requests" });
      this.hasMany(models.Friend, {
        foreignKey: "friendId",
        as: "SentRequests",
      });
      this.hasMany(models.Notification, {
        foreignKey: "recipientId",
        as: "notificationFor",
      });
      this.hasMany(models.Notification, {
        foreignKey: "senderId",
        as: "notificationBy",
      });
    }
  }
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM(...GENDER),
        allowNull: false,
      },
      occupation: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      interestedTopics: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
      },
      hobbies: { type: DataTypes.ARRAY(DataTypes.INTEGER), defaultValue: [] },
      region: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      countryCode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      profilePublicId: {
        type: DataTypes.STRING,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
    }
  );

  // Hash password before creating user
  User.beforeCreate(async (user) => {
    try {
      const hash = await bcrypt.hash(user.password, 10);
      user.password = hash;
    } catch (err) {
      throw new Error("Error hashing password");
    }
  });

  // Use regular function to maintain 'this' context
  User.prototype.validPassword = function (password) {
    return bcrypt.compare(password, this.password);
  };

  // Generate hash for password changes
  User.prototype.generateHash = function (password) {
    return bcrypt.hash(password, 10);
  };

  // Generate access token (assuming jwt is required)
  User.prototype.generateAccessToken = function () {
    return jwt.sign(
      {
        id: this.id,
        username: this.username,
        email: this.email,
      },
      process.env.ACCESS_TOKEN_SECRET, // Add your secret key
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY } // Add expiration time
    );
  };

  User.prototype.generateEmailVerificationToken = function () {
    return jwt.sign(
      {
        email: this.email,
      },
      process.env.EMAIL_VERIFY_TOKEN_SECRET,
      { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRY }
    );
  };

  return User;
};
