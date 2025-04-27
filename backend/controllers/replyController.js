const Reply = require('../models/Reply');
const Comment = require('../models/Comment');

// Get all replies for a comment
exports.getRepliesByComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const replies = await Reply.find({ comment: commentId })
      .populate('user', 'username')
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json(replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ message: 'Failed to fetch replies' });
  }
};

// Create a reply
exports.createReply = async (req, res) => {
  try {
    const { content } = req.body;
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const commentExists = await Comment.findById(commentId);
    if (!commentExists) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (!content.trim() && !req.file) {
      return res.status(400).json({ message: 'Cannot post empty reply' });
    }

    let base64Image = '';
    if (req.file) {
      const mimeType = req.file.mimetype;
      base64Image = `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
    }

    const newReply = new Reply({
      content,
      comment: commentId,
      user: userId,
      image: base64Image,
    });

    const savedReply = await newReply.save();
    const populatedReply = await Reply.findById(savedReply._id)
      .populate('user', 'username');

    req.io.emit('newReply', populatedReply);

    res.status(201).json(populatedReply);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Failed to create reply' });
  }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
  try {
    const replyId = req.params.replyId;
    const userId = req.user.id;

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.user.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this reply' });
    }

    await reply.deleteOne();

    req.io.emit('deleteReply', { replyId, commentId: reply.comment });

    res.status(200).json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ message: 'Failed to delete reply' });
  }
};
