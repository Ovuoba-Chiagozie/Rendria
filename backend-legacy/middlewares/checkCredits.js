// middlewares/checkCredits.js
import { getCredits } from "../utils/credits.js";

export const checkCredits = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const credits = await getCredits(req.userId);

    if (credits <= 0) {
      return res.status(403).json({ message: "Insufficient credits" });
    }

    // attach to request for later use
    req.credits = credits;
    next();
  } catch (err) {
    console.error("Error checking credits:", err);
    res.status(500).json({ message: "Server error checking credits" });
  }
};
