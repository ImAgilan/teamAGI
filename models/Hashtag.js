/**
 * Hashtag Model - Tracks trending hashtags
 */
const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true, unique: true, lowercase: true, trim: true },
    postsCount: { type: Number, default: 1 },
    // For trending calculation: posts in last 24h
    recentPosts: { type: Number, default: 1 },
    lastUsed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

hashtagSchema.index({ postsCount: -1 });
hashtagSchema.index({ recentPosts: -1, lastUsed: -1 }); // Trending index
hashtagSchema.index({ tag: 'text' });

module.exports = mongoose.model('Hashtag', hashtagSchema);
