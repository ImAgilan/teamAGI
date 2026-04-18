/**
 * Post Model
 * Supports text, image, and video content
 */
const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  type: { type: String, enum: ['image', 'video'], required: true },
  width: Number,
  height: Number,
  duration: Number, // video duration in seconds
}, { _id: false });

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      maxlength: [2200, 'Post content cannot exceed 2200 characters'],
      trim: true,
    },
    media: [mediaSchema],

    // ── Engagement ────────────────────────────────────────────
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    bookmarksCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    // ── Metadata ──────────────────────────────────────────────
    hashtags: [{ type: String, lowercase: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    location: {
      name: String,
      coordinates: { lat: Number, lng: Number },
    },

    // ── Share / Repost ────────────────────────────────────────
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    repostText: { type: String, maxlength: 500 },

    // ── Status ────────────────────────────────────────────────
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    isDraft: { type: Boolean, default: false },
    isModerated: { type: Boolean, default: false },
    moderationReason: { type: String },
    isDeleted: { type: Boolean, default: false },

    // ── AI ────────────────────────────────────────────────────
    aiSuggested: { type: Boolean, default: false },
    sentimentScore: { type: Number }, // -1 to 1
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ───────────────────────────────────────────────────
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ likesCount: -1, commentsCount: -1, createdAt: -1 }); // trending
postSchema.index({ content: 'text', hashtags: 'text' }); // full-text search
postSchema.index({ isDeleted: 1, isDraft: 1, visibility: 1 });

// ── Pre-find: Exclude deleted posts ───────────────────────────
postSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false, isDraft: false });
  }
  next();
});

// ── Static: Extract hashtags from content ─────────────────────
postSchema.statics.extractHashtags = (content) => {
  if (!content) return [];
  const matches = content.match(/#[\w]+/g) || [];
  return [...new Set(matches.map((h) => h.slice(1).toLowerCase()))];
};

module.exports = mongoose.model('Post', postSchema);
