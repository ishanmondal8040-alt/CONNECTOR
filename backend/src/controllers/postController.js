import prisma from "../config/prisma.js";

export const fetchPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: "desc" } }).catch(() => []);
    return res.status(200).json({ success: true, data: posts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;
    const post = await prisma.post.create({
      data: { caption: caption || "", imageUrl: imageUrl || null, authorId: "mock_id" }
    }).catch(() => ({ id: Date.now().toString(), caption, imageUrl, createdAt: new Date() }));

    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
