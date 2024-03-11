import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_KEY || "somethingsecret",
    {
      expiresIn: "1h",
    }
  );
};
