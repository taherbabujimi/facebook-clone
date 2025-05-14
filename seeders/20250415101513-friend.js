"use strict";

// Function to generate random integer within range (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, fetch all existing user IDs from the database
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM "users"',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Extract just the IDs into an array
    const validUserIds = users.map((user) => user.id);

    // Make sure we have enough users to create friendships
    if (validUserIds.length < 2) {
      console.log("Not enough users to create friendships");
      return;
    }

    // Generate 100 random friendships using only valid user IDs
    const friendships = [];
    const existingPairs = new Set(); // To track already created pairs
    const now = new Date();

    // Try to create up to 100 friendships
    let attempts = 0;
    let friendshipsCreated = 0;

    while (friendshipsCreated < 100 && attempts < 1000) {
      attempts++;

      // Select random user IDs from our valid IDs array
      const userIndex = getRandomInt(0, validUserIds.length - 1);
      const userId = validUserIds[userIndex];

      const friendIndex = getRandomInt(0, validUserIds.length - 1);
      const friendId = validUserIds[friendIndex];

      // Skip if same user
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
      friendshipsCreated++;

      console.log({
        userId,
        friendId,
        status: "confirm",
      });
    }

    console.log(`Created ${friendships.length} friendship records`);

    // Bulk insert all valid friendships
    if (friendships.length > 0) {
      await queryInterface.bulkInsert("friends", friendships, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("friends", null, {});
  },
};
