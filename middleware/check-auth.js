import jwt from "jsonwebtoken";

export const checkAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.JWT_KEY, (err, decodedToken) => {
      console.log("token: ", token);
      console.log("decodedToken: ", decodedToken);
      if (err) {
        console.log("err: ", err);
        return res.status(403).json({ message: "Invalid Token" });
      }
      req.userData = {
        email: decodedToken.email,
        userId: decodedToken.userId,
      };
      next();
    });
  } catch (error) {
    console.log("error: " + error);
    return res.status(401).json({ message: "You are not authenticated!" });
  }
};
