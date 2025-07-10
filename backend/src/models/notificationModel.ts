import mongoose, { Schema, Document, Types } from "mongoose";

const NOTIFICATION_TYPES = ["like", "comment", "follow"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  user: Types.ObjectId;
  sender: Types.ObjectId;
  type: NotificationType;
  post?: Types.ObjectId;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.virtual("messageText").get(function (this: INotification) {
  switch (this.type) {
    case "like":
      return "liked your post";
    case "comment":
      return "commented on your post";
    case "follow":
      return "started following you";
    default:
      return "";
  }
});

const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
export default NotificationModel;