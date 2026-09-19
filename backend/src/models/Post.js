import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      ref: 'User',
    },
    likes: [
      {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model('Post', postSchema);
