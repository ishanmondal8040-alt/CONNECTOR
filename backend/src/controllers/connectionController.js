import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingRequests,
  getSentRequests,
  getFriends,
  removeFriend,
} from "../services/connectionService.js";

export const createFriendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required.",
      });
    }

    const request = await sendFriendRequest(
      req.user.id,
      receiverId
    );

    res.status(201).json({
      success: true,
      message: "Friend request sent successfully.",
      request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const request = await acceptFriendRequest(
      req.params.connectionId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Friend request accepted successfully.",
      request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const request = await rejectFriendRequest(
      req.params.connectionId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Friend request rejected successfully.",
      request,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPendingRequestList = async (req, res) => {
  try {
    const requests = await getPendingRequests(req.user.id);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSentRequestList = async (req, res) => {
  try {
    const requests = await getSentRequests(req.user.id);

    res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFriendsList = async (req, res) => {
  try {
    const friends = await getFriends(req.user.id);

    res.status(200).json({
      success: true,
      count: friends.length,
      friends,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const result = await removeFriend(
      req.params.connectionId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Friend removed successfully.",
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};