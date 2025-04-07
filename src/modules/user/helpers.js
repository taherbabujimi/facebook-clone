const jwt = require("jsonwebtoken");

const generateForgotPasswordToken = async (email) => {
  return await jwt.sign(
    {
      email: email,
    },
    process.env.FORGOTPASSWORD_TOKEN_SECRET,
    {
      expiresIn: process.env.FORGOTPASSWORD_TOKEN_EXPIRY,
    }
  );
};

module.exports = { generateForgotPasswordToken };
