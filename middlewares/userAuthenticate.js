import jwt from "jsonwebtoken";
import createError from "http-errors";

// Middleware to verify token and attach user data to req.user
export const verifyToken = (req, res, next) => {
  try {
    let token;
    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Fallback to token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return next(createError(401, "Access denied. Token missing."));
    }

    // Verify the token and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach the decoded token (e.g., { id, role }) to the request object
    next();
  } catch (error) {
    return next(createError(403, "Invalid or expired token."));
  }
};

// Middleware to check if the user is an admin
export const isAdmin = async (req, res, next) => {
  try {
    // Ensure the user has the admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next(); // Proceed if admin
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
