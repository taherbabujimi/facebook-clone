const GENDER = ["male", "female", "other"];
const link = "http://localhost:3003/v1/user/resetPassword?token=";
const forgotPasswordSubject = "Link for Resetting your Password";
const verifyEmailLink = "http://localhost:3003/v1/user/verifyEmail?token=";
const verifyEmailSubject = "Link for verifying email";
const userLoginLink = "http://localhost:3003/v1/user/userLogin";

module.exports = {
  GENDER,
  link,
  forgotPasswordSubject,
  verifyEmailLink,
  verifyEmailSubject,
  userLoginLink,
};
