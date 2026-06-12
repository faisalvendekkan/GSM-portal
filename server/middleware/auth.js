const jwt = require("jsonwebtoken");
const env = require("../config/env");

const accessSecret = env.accessSecret;

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, accessSecret);
    req.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
      name: payload.name
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to access this page." });
    }
    return next();
  };
}

module.exports = {
  authenticate,
  authorize
};
