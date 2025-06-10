import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMessage extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  text: string;
}

const messageSchema = new Schema<IMessage>(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);
export default Message;