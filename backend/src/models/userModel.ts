import mongoose, { Schema, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  username: string;
  password: string;
  lastLogin?: Date;
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  bio?: string;
  avatarUrl?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Invalid email address"
      }
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Full name must be at least 2 characters long"],
      maxlength: [50, "Full name must be at most 50 characters long"]
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username must be at most 30 characters long"],
      validate: {
        validator: function(v: string) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: "Username can only contain letters, numbers, and underscores"
      }
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: [6, "Password must be at least 6 characters long"]
    },
    lastLogin: Date,
    followers: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      default: []
    }],
    following: [{
      type: Schema.Types.ObjectId,
      ref: "User",
      default: []
    }],
    bio: {
      type: String,
      trim: true,
      maxlength: [160, "Bio must be at most 160 characters long"]
    },
    avatarUrl: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model<IUser>("User", userSchema);
export default User;