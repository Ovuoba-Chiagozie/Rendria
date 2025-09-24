// utils/credits.js
import User from "../models/User.js";

// Deduct credits
export const deductCredits = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (user.credits < amount) throw new Error("Not enough credits");

  user.credits -= amount;
  await user.save();
  return user.credits;
};

// Add credits
export const addCredits = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.credits += amount;
  await user.save();
  return user.credits;
};

// Check balance
export const getCredits = async (userId) => {
  const user = await User.findById(userId).select("credits");
  if (!user) throw new Error("User not found");
  return user.credits;
};
