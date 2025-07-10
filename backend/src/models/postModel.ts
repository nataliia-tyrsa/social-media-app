import mongoose, { Schema, Document } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  likes: mongoose.Types.ObjectId[];
}

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  image?: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },
    image: {
      type: String,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      default: []
    }],
    comments: [{
      author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      likes: [{
        type: Schema.Types.ObjectId,
        ref: "User",
        default: []
      }]
    }]
  },
  {
    timestamps: true,
  }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: "text" });

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;