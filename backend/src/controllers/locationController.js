import {
  updateUserLocation,
  getNearbyUsers,
} from "../services/locationService.js";

export const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required.",
      });
    }

    const user = await updateUserLocation(
      req.user.id,
      latitude,
      longitude
    );

    return res.status(200).json({
      success: true,
      message: "Location updated successfully.",
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNearbyUserList = async (req, res) => {
  try {
    const radius = req.query.radius || 5;

    const result = await getNearbyUsers(
      req.user.id,
      radius
    );

    return res.status(200).json({
      success: true,
      radius: result.radius,
      count: result.users.length,
      users: result.users,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};