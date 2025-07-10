import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPasswordReset extends Document {
  user: Types.ObjectId;
  token: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
});

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model<IPasswordReset>("PasswordReset", passwordResetSchema);

export default PasswordReset; 
