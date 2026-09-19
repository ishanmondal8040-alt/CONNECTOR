import {
  createComment,
  getPostComments,
  editComment,
  deleteComment,
} from "../services/commentService.js";

export const createCommentController = async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await createComment(
      req.user.id,
      req.params.postId,
      content
    );

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      data: comment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPostCommentsController = async (req, res) => {
  try {
    const comments = await getPostComments(req.params.postId);

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const editCommentController = async (req, res) => {
  try {
    const { content } = req.body;

    const comment = await editComment(
      req.user.id,
      req.params.commentId,
      content
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      data: comment,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCommentController = async (req, res) => {
  try {
    const result = await deleteComment(
      req.user.id,
      req.params.commentId
    );

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
      commentId: result.commentId,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};