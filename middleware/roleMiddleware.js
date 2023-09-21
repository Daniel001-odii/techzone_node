


const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
      const user = req.user; // Assuming user information is attached to the request object after authentication
  
      if (user && user.role === requiredRole) {
        // User has the required role, so they are allowed to proceed
        next();
      } else {
        // User does not have the required role, deny access
        res.status(403).json({ message: 'Access denied' });
      }
    };
  };
  
  module.exports = roleMiddleware;