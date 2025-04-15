"use strict";
const bcrypt = require("bcrypt");

// Country configuration with timezones and regions
const COUNTRIES = [
  { code: "AF", region: "Asia & Pacific", timezone: "Asia/Kabul" },
  { code: "AU", region: "Asia & Pacific", timezone: "Australia/Sydney" },
  { code: "BT", region: "Asia & Pacific", timezone: "Asia/Thimphu" },
  { code: "CA", region: "North America", timezone: "America/Toronto" },
  { code: "CH", region: "Europe", timezone: "Europe/Zurich" },
  { code: "IN", region: "Asia & Pacific", timezone: "Asia/Kolkata" },
];

// Helper functions
const randomBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = () =>
  new Date(
    1970 + randomBetween(0, 40),
    randomBetween(0, 11),
    randomBetween(1, 28)
  )
    .toISOString()
    .split("T")[0];

const getRandomSubset = (size) => {
  const nums = new Set();
  while (nums.size < size) {
    nums.add(randomBetween(1, 6));
  }
  return Array.from(nums);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [];

    for (let i = 1; i <= 200; i++) {
      const country = COUNTRIES[randomBetween(0, COUNTRIES.length - 1)];
      const username = `user${i}`;

      users.push({
        username,
        email: `${username}@mailinator.com`,
        password: await bcrypt.hash(username, 10),
        dateOfBirth: randomDate(),
        gender: randomBetween(0, 1) ? "male" : "female",
        occupation: randomBetween(1, 8),
        interestedTopics: getRandomSubset(randomBetween(1, 3)),
        hobbies: getRandomSubset(randomBetween(1, 3)),
        countryCode: country.code,
        region: country.region,
        timezone: country.timezone,
        profilePublicId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isVerified: true,
      });
    }

    await queryInterface.bulkInsert("users", users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", null, {});
  },
};
