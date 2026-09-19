import rateLimit from "express-rate-limit";

// Applies to POST /api/auth/register and POST /api/auth/login only.
// Development settings: 20 requests per IP per 15-minute window.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true, // adds RateLimit-* response headers
  legacyHeaders: false, // omits deprecated X-RateLimit-* headers

  // Sends the response directly, in the same shape as the rest of the
  // API's error responses, instead of express-rate-limit's plain-text
  // default.
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication requests. Please try again later.",
      statusCode: 429,
    });
  },
});