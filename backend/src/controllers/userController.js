import { updateUserProfile } from "../services/userService.js";

export const updateProfile = async (req, res) => {
  try {
    const user = await updateUserProfile(req.user.id, req.body);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};