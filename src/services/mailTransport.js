const { google } = require("googleapis");
const nodemailer = require("nodemailer");

module.exports.emailTransport = async (from, to, subject, html) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

  oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

  const accessToken = await oauth2Client.getAccessToken();

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "taher.babuji@mindinventory.com",
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: from,
    to: to,
    subject: subject,
    html: html,
  };

  return await transport.sendMail(mailOptions);
};
