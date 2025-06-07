import mongoose, { Schema, Document, Types } from "mongoose";

export type NotificationType = "like" | "comment" | "follow";

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
      enum: ["like", "comment", "follow"],
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

const NotificationModel = mongoose.model<INotification>("Notification", notificationSchema);
export default NotificationModel;