import User, { IUser } from "../models/userModel";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken";

interface RegisterData {
  email: string;
  fullName: string;
  username: string;
  password: string;
}

interface LoginData {
  identifier: string;
  password: string;
}

interface UpdateProfileData {
  fullName?: string;
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

export const registerUser = async (data: RegisterData): Promise<{ token: string; user: Partial<IUser> }> => {
  const { email, fullName, username, password } = data;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    throw new Error("User already exists");
  }

  const user = new User({
    email,
    fullName,
    username,
    password,
  });

  await user.save();

  const token = generateToken(user._id.toString());
  const { password: _, ...userData } = user.toObject();

  return { token, user: userData };
};

export const loginUser = async (data: LoginData): Promise<{ token: string; user: Partial<IUser> }> => {
  const { identifier, password } = data;

  console.log('Login attempt:', { identifier, passwordLength: password.length });

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  }).select("+password");

  console.log('User found:', !!user, user?.username);

  if (!user) {
    console.log('User not found for identifier:', identifier);
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(password);
  console.log('Password match:', isMatch);
  
  if (!isMatch) {
    console.log('Invalid credentials for user:', user.username);
    throw new Error("Invalid credentials");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id.toString());
  const { password: _, ...userData } = user.toObject();

  console.log('Login successful for user:', user.username);
  return { token, user: userData };
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileData
): Promise<Partial<IUser>> => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new Error("User not found");
  }

  if (data.fullName) user.fullName = data.fullName;
  if (data.bio !== undefined) user.bio = data.bio;
  if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
  
  if (data.username) {
    const existingUser = await User.findOne({ 
      username: data.username, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      throw new Error("Username already taken");
    }
    user.username = data.username;
  }

  if (data.email) {
    const existingUser = await User.findOne({ 
      email: data.email, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      throw new Error("Email already taken");
    }
    user.email = data.email;
  }

  if (data.currentPassword && data.newPassword) {
    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) {
      throw new Error("Current password is incorrect");
    }
    user.password = data.newPassword;
  }

  await user.save();
  const { password: _, ...userData } = user.toObject();

  return userData;
};

export const getUserById = async (userId: string): Promise<Partial<IUser>> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user.toObject();
};