import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

import {
  createPostApi,
  fetchFeedApi,
  editPostApi,
  deletePostApi,
  uploadPostImageApi,
} from "../services/postService";

import {
  createCommentApi,
  fetchPostCommentsApi,
  editCommentApi,
  deleteCommentApi,
} from "../services/commentService";

function formatTime(dateString) {
  if (!dateString) {
    return "";
  }

  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Feed() {
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deletingPostId, setDeletingPostId] = useState(null);

  // Comments
  const [openComments, setOpenComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loadingComments, setLoadingComments] = useState({});
  const [postingCommentFor, setPostingCommentFor] = useState(null);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [savingCommentId, setSavingCommentId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetchFeedApi();
      setPosts(response.data.posts || []);
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not load posts.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();

    const trimmedCaption = caption.trim();

    if ((!trimmedCaption && !selectedImage) || isPosting) {
      return;
    }

    setIsPosting(true);

    try {
      let uploadedImageUrl = null;

      if (selectedImage) {
        const uploadResponse = await uploadPostImageApi(selectedImage);
        uploadedImageUrl = uploadResponse.data.imageUrl;
      }

      const response = await createPostApi(trimmedCaption, uploadedImageUrl);

      setPosts((prev) => [response.data.data, ...prev]);
      setCaption("");
      setSelectedImage(null);
      setImagePreview(null);

      toast.success("Post created");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not create post.";
      toast.error(message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditPostClick = (post) => {
    setEditingPostId(post.id);
    setEditCaption(post.caption || "");
  };

  const handleCancelPostEdit = () => {
    setEditingPostId(null);
    setEditCaption("");
  };

  const handleSavePostEdit = async (postId) => {
    const trimmedCaption = editCaption.trim();

    if (!trimmedCaption || isSavingEdit) {
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await editPostApi(postId, trimmedCaption);

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? response.data.data : post
        )
      );

      setEditingPostId(null);
      setEditCaption("");

      toast.success("Post updated");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not update post.";
      toast.error(message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed || deletingPostId) {
      return;
    }

    setDeletingPostId(postId);

    try {
      await deletePostApi(postId);

      setPosts((prev) =>
        prev.filter((post) => post.id !== postId)
      );

      setCommentsByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });

      toast.success("Post deleted");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not delete post.";
      toast.error(message);
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleToggleComments = async (postId) => {
    const isAlreadyOpen = openComments[postId];

    if (isAlreadyOpen) {
      setOpenComments((prev) => ({
        ...prev,
        [postId]: false,
      }));
      return;
    }

    setOpenComments((prev) => ({
      ...prev,
      [postId]: true,
    }));

    if (commentsByPost[postId]) {
      return;
    }

    setLoadingComments((prev) => ({
      ...prev,
      [postId]: true,
    }));

    try {
      const response = await fetchPostCommentsApi(postId);

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: response.data.comments || [],
      }));
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not load comments.";
      toast.error(message);
    } finally {
      setLoadingComments((prev) => ({
        ...prev,
        [postId]: false,
      }));
    }
  };

  const handleCommentDraftChange = (postId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleCreateComment = async (event, postId) => {
    event.preventDefault();

    const content = (commentDrafts[postId] || "").trim();

    if (!content || postingCommentFor) {
      return;
    }

    setPostingCommentFor(postId);

    try {
      const response = await createCommentApi(postId, content);

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [
          ...(prev[postId] || []),
          response.data.data,
        ],
      }));

      setCommentDrafts((prev) => ({
        ...prev,
        [postId]: "",
      }));

      toast.success("Comment added");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not add comment.";
      toast.error(message);
    } finally {
      setPostingCommentFor(null);
    }
  };

  const handleEditCommentClick = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.content);
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditCommentDraft("");
  };

  const handleSaveCommentEdit = async (postId, commentId) => {
    const content = editCommentDraft.trim();

    if (!content || savingCommentId) {
      return;
    }

    setSavingCommentId(commentId);

    try {
      const response = await editCommentApi(commentId, content);

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((comment) =>
          comment.id === commentId
            ? response.data.data
            : comment
        ),
      }));

      setEditingCommentId(null);
      setEditCommentDraft("");

      toast.success("Comment updated");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not update comment.";
      toast.error(message);
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const confirmed = window.confirm(
      "Delete this comment?"
    );

    if (!confirmed || deletingCommentId) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      await deleteCommentApi(commentId);

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(
          (comment) => comment.id !== commentId
        ),
      }));

      toast.success("Comment deleted");
    } catch (error) {
      const message =
        error.response?.data?.message || "Could not delete comment.";
      toast.error(message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">
        Feed
      </h1>

      {/* Create Post */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex items-center gap-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {user?.name}
            </p>

            <p className="text-xs text-slate-500">
              Create a new post
            </p>
          </div>
        </div>

        <form onSubmit={handleCreatePost}>
          <textarea
            value={caption}
            onChange={(event) =>
              setCaption(event.target.value)
            }
            placeholder="What's on your mind?"
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />

          {/* Image Preview Area */}
          {imagePreview && (
            <div className="relative mt-3">
              <img
                src={imagePreview}
                alt="Selected preview"
                className="max-h-60 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-900"
              >
                ✕ Remove
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900">
              <svg
                className="h-5 w-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Add Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={(!caption.trim() && !selectedImage) || isPosting}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPosting ? "Posting..." : "Post"}
            </button>
          </div>
        </form>
      </section>

      {/* Feed */}
      <section className="mt-6 space-y-4">
        {isLoading && (
          <p className="text-center text-sm text-slate-500">
            Loading posts...
          </p>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              No posts yet. Create the first one!
            </p>
          </div>
        )}

        {!isLoading &&
          posts.map((post) => {
            const isOwnPost = post.authorId === user?.id;
            const isEditingPost =
              editingPostId === post.id;

            const comments =
              commentsByPost[post.id] || [];

            return (
              <article
                key={post.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {post.author?.profileImage ? (
                      <img
                        src={post.author.profileImage}
                        alt={post.author.name}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {post.author?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {post.author?.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {formatTime(post.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isOwnPost && !isEditingPost && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleEditPostClick(post)
                        }
                        className="text-xs font-medium text-slate-500 hover:text-slate-900"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePost(post.id)
                        }
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        {deletingPostId === post.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                {isEditingPost ? (
                  <div className="mt-4">
                    <textarea
                      value={editCaption}
                      onChange={(event) =>
                        setEditCaption(event.target.value)
                      }
                      rows={3}
                      className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none"
                    />

                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelPostEdit}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSavePostEdit(post.id)
                        }
                        disabled={
                          !editCaption.trim() ||
                          isSavingEdit
                        }
                        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {isSavingEdit
                          ? "Saving..."
                          : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.caption && (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {post.caption}
                      </p>
                    )}

                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="mt-4 max-h-[500px] w-full rounded-xl object-cover"
                      />
                    )}
                  </>
                )}

                {/* Comments Button */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleComments(post.id)
                    }
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    {openComments[post.id]
                      ? "Hide comments"
                      : "Comments"}
                  </button>
                </div>

                {/* Comments Area */}
                {openComments[post.id] && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <form
                      onSubmit={(event) =>
                        handleCreateComment(
                          event,
                          post.id
                        )
                      }
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={
                          commentDrafts[post.id] || ""
                        }
                        onChange={(event) =>
                          handleCommentDraftChange(
                            post.id,
                            event.target.value
                          )
                        }
                        placeholder="Write a comment..."
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                      />

                      <button
                        type="submit"
                        disabled={
                          !(
                            commentDrafts[post.id] || ""
                          ).trim() ||
                          postingCommentFor === post.id
                        }
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {postingCommentFor === post.id
                          ? "..."
                          : "Comment"}
                      </button>
                    </form>

                    {loadingComments[post.id] && (
                      <p className="mt-4 text-xs text-slate-500">
                        Loading comments...
                      </p>
                    )}

                    {!loadingComments[post.id] &&
                      comments.length === 0 && (
                        <p className="mt-4 text-xs text-slate-400">
                          No comments yet.
                        </p>
                      )}

                    <div className="mt-4 space-y-3">
                      {comments.map((comment) => {
                        const isOwnComment =
                          comment.authorId === user?.id;

                        const isEditingComment =
                          editingCommentId ===
                          comment.id;

                        return (
                          <div
                            key={comment.id}
                            className="flex gap-2"
                          >
                            {comment.author
                              ?.profileImage ? (
                              <img
                                src={
                                  comment.author
                                    .profileImage
                                }
                                alt={
                                  comment.author.name
                                }
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                                {comment.author?.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-900">
                                    {
                                      comment.author
                                        ?.name
                                    }
                                  </p>

                                  <p className="text-[10px] text-slate-400">
                                    {formatTime(
                                      comment.createdAt
                                    )}
                                    {comment.editedAt
                                      ? " · Edited"
                                      : ""}
                                  </p>
                                </div>

                                {isOwnComment &&
                                  !isEditingComment && (
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEditCommentClick(
                                            comment
                                          )
                                        }
                                        className="text-[10px] text-slate-500 hover:text-slate-900"
                                      >
                                        Edit
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteComment(
                                            post.id,
                                            comment.id
                                          )
                                        }
                                        className="text-[10px] text-red-500 hover:text-red-700"
                                      >
                                        {deletingCommentId ===
                                        comment.id
                                          ? "Deleting..."
                                          : "Delete"}
                                      </button>
                                    </div>
                                  )}
                              </div>

                              {isEditingComment ? (
                                <div className="mt-2">
                                  <input
                                    value={
                                      editCommentDraft
                                    }
                                    onChange={(event) =>
                                      setEditCommentDraft(
                                        event.target
                                          .value
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm outline-none"
                                  />

                                  <div className="mt-2 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={
                                        handleCancelCommentEdit
                                      }
                                      className="text-xs text-slate-500"
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveCommentEdit(
                                          post.id,
                                          comment.id
                                        )
                                      }
                                      disabled={
                                        !editCommentDraft.trim() ||
                                        savingCommentId ===
                                          comment.id
                                      }
                                      className="text-xs font-semibold text-slate-900 disabled:opacity-50"
                                    >
                                      {savingCommentId ===
                                      comment.id
                                        ? "Saving..."
                                        : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
      </section>
    </div>
  );
}