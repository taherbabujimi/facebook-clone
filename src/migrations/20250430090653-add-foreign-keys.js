module.exports = {
  async up(queryInterface, Sequelize) {
    // Add foreign key to messages table for roomId
    await queryInterface.addConstraint("messages", {
      fields: ["roomId"],
      type: "foreign key",
      name: "fk_messages_rooms",
      references: {
        table: "rooms",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Add foreign key to rooms table for lastMessageId
    await queryInterface.addConstraint("rooms", {
      fields: ["lastMessageId"],
      type: "foreign key",
      name: "fk_rooms_messages",
      references: {
        table: "messages",
        field: "id",
      },
      onDelete: "SET NULL", // If a message is deleted, set lastMessageId to null
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("rooms", "fk_rooms_messages");
    await queryInterface.removeConstraint("messages", "fk_messages_rooms");
  },
};
