import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExploreItem extends Document {
  post: Types.ObjectId;
  priority: number;
  createdAt: Date;
}

const exploreSchema = new Schema<IExploreItem>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      unique: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model<IExploreItem>("Explore", exploreSchema);