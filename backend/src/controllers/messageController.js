import {
  sendMessage,
  getChatHistory,
  getConversationList,
  markChatAsRead,
  toggleReaction,
  editMessage,
  deleteMessageForMe,
} from "../services/messageService.js";

export const createMessage = async (req, res) => {
  try {
    const { receiverId, content, replyToId } = req.body;

    const message = await sendMessage(
      req.user.id,
      receiverId,
      content,
      replyToId
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChat = async (req, res) => {
  try {
    const chat = await getChatHistory(
      req.user.id,
      req.params.userId
    );

    return res.status(200).json({
      success: true,
      count: chat.messages.length,
      chatWith: chat.user,
      messages: chat.messages,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const conversations = await getConversationList(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const result = await markChatAsRead(
      req.user.id,
      req.params.userId
    );

    return res.status(200).json({
      success: true,
      message: "Messages marked as read successfully.",
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { emoji } = req.body;

    const result = await toggleReaction(
      req.user.id,
      req.params.messageId,
      emoji
    );

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      reactions: result.reactions,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const editMessageController = async (req, res) => {
  try {
    const { content } = req.body;

    const updatedMessage = await editMessage(
      req.user.id,
      req.params.messageId,
      content
    );

    return res.status(200).json({
      success: true,
      message: "Message edited successfully.",
      data: updatedMessage,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteMessageForMeController = async (req, res) => {
  try {
    await deleteMessageForMe(req.user.id, req.params.messageId);

    return res.status(200).json({
      success: true,
      message: "Message deleted for you.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};