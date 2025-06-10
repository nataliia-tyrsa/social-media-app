import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILike extends Document {
  user: Types.ObjectId;
  post: Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const Like = mongoose.model<ILike>("Like", likeSchema);
export default Like;