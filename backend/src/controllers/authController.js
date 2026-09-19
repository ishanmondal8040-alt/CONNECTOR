import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Fast Instant Response
    const user = { id: "demo_id", email, name: email.split("@")[0] };

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  return loginUser(req, res);
};
