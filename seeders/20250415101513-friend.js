"use strict";

// Function to generate random integer within range (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate 100 random friendships
const friendships = [];
const existingPairs = new Set(); // To track already created pairs
const now = new Date();
// let i = 0;

for (let i = 0; i < 100; i++) {
  let j = 0;
  // Generate random user IDs between 15 and 214
  const userId = getRandomInt(15, 214);

  while (j < 10) {
    const friendId = getRandomInt(15, 214);

    if (userId === friendId) {
      continue;
    }

    // Create a unique key for this friendship pair
    const pairKey = `${userId}-${friendId}`;
    const reversePairKey = `${friendId}-${userId}`;

    // Skip if this pair or its reverse already exists
    if (existingPairs.has(pairKey) || existingPairs.has(reversePairKey)) {
      continue;
    }

    console.log({
      userId,
      friendId,
      status: "confirm",
    });

    // Add this friendship to our results
    friendships.push({
      userId,
      friendId,
      status: "confirm",
      createdAt: now,
      updatedAt: now,
    });

    // Mark this pair as used
    existingPairs.add(pairKey);

    j++;
  }

  // Skip if userId equals friendId
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("friends", friendships, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("friends", null, {});
  },
};
