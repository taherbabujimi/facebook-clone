const requestStatus = ["pending", "confirm"];

const notificationType = [
  "friendRequest",
  "friendAccept",
  "postLike",
  "postComment",
  "commentReply",
];

const entityType = ["friend", "post", "comment", "like"];

const notificationStatus = ["unread", "read"];

const pageStatus = ["active", "inactive", "unpublished", "suspended"];

module.exports = {
  requestStatus,
  notificationType,
  entityType,
  notificationStatus,
  pageStatus,
};
