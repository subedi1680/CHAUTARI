const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Get all comments for a post
exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

// Create a new comment and update the post's comment array
exports.createComment = async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;
    const userId = req.user.id;

    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!content.trim() && !req.file) {
      return res.status(400).json({ message: 'Cannot post empty comment' });
    }

    let base64Image = '';
    if (req.file) {
      const mimeType = req.file.mimetype;
      base64Image = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
    }

    const newComment = new Comment({
      content,
      post: postId,
      user: userId,
      image: base64Image,
    });

    const savedComment = await newComment.save();

    // Add the comment to the post's comments array and update the post's comment count
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: savedComment._id },
      $inc: { commentCount: 1 },  // Increment the comment count for the post
    });

    const populatedComment = await Comment.findById(savedComment._id)
      .populate('user', 'username');

    // Emit the event for new comment
    req.io.emit('newComment', populatedComment);

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
};

// Delete a comment and update the comment count for the post
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    const postId = comment.post;
    await comment.deleteOne();

    // Remove the comment from the post's comment array and update the comment count
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
      $inc: { commentCount: -1 },  // Decrement the comment count for the post
    });

    req.io.emit('deleteComment', { commentId, postId });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};
