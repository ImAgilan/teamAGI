/**
 * Database Seeder - 100 Users & Posts
 * Run: node utils/seeder.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Hashtag = require('../models/Hashtag');

// Helper functions
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Cameron', 'Quinn', 'Blake', 'Dakota',
  'Avery', 'Harper', 'Sage', 'Rowan', 'Emery', 'Peyton', 'Finley', 'Skyler', 'Charlie', 'Reese',
  'Jamie', 'Jesse', 'Tatum', 'Logan', 'Sawyer', 'Ellis', 'Phoenix', 'River', 'Indigo', 'Arden',
  'Lennox', 'Briar', 'Sutton', 'Monroe', 'Haven', 'Wren', 'Lake', 'Storm', 'Justice', 'True'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const BIO_TEMPLATES = [
  '✨ Living life one day at a time', '💻 Developer | ☕ Coffee enthusiast', '📷 Capturing moments',
  '🎨 Creative soul', '🌍 Explorer of the world', '🚀 Building cool things', '📚 Book lover',
  '🎵 Music addict', '🧘‍♀️ Finding balance', '💡 Curious mind'
];

const POST_TEMPLATES = [
  'Just finished an amazing project! {hashtags}', 'Morning thoughts: stay positive and work hard. {hashtags}',
  'Anyone else love this weather? {hashtags}', 'Learning something new every day. {hashtags}',
  'Sharing my latest creation with you all. {hashtags}', 'Weekend vibes are the best. {hashtags}',
  'Couldn’t agree more with this quote. {hashtags}', 'Behind the scenes of my workflow. {hashtags}',
  'Grateful for this community. {hashtags}', 'What’s your favorite way to relax? {hashtags}',
  'Progress over perfection. {hashtags}', 'New challenge accepted! {hashtags}',
  'Here’s a tip that changed my perspective. {hashtags}', 'Making memories with great people. {hashtags}',
  'Obsessed with this new track. {hashtags}'
];

const HASHTAG_POOL = [
  '#life', '#love', '#happy', '#fun', '#work', '#goals', '#inspiration', '#tech', '#art',
  '#music', '#nature', '#travel', '#food', '#fitness', '#coding', '#design', '#photography',
  '#mindfulness', '#success', '#motivation', '#creativity', '#learning', '#community',
  '#morning', '#night', '#weekend', '#vibes', '#cool', '#awesome', '#dream', '#future'
];

const randomHashtags = () => {
  const shuffled = [...HASHTAG_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, rand(2, 5)).join(' ');
};

const generatePostContent = () => {
  const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
  const hashtags = randomHashtags();
  return template.replace('{hashtags}', hashtags);
};

const generateDisplayName = (index) => {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length];
  return `${firstName} ${lastName}`;
};

const generateBio = () => BIO_TEMPLATES[Math.floor(Math.random() * BIO_TEMPLATES.length)];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Post.deleteMany(), Comment.deleteMany(), Hashtag.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // -------------------- CREATE 100 USERS (FIXED BATCH INSERT) --------------------
    const allUsers = [];        // will store created user documents
    const BATCH_SIZE = 20;
    let userObjects = [];       // temporary array for each batch

    for (let i = 1; i <= 100; i++) {
      const username = `user_${i}`;
      const email = `user${i}@teamagi.social`;
      const displayName = generateDisplayName(i);
      const bio = generateBio();
      const role = i === 1 ? 'admin' : 'user';
      
      userObjects.push({
        username,
        displayName,
        email,
        password: 'Test123!',
        bio,
        role,
        following: [],
        followers: [],
        followingCount: 0,
        followersCount: 0,
        postsCount: 0
      });

      // Insert batch when full or last user
      if (userObjects.length === BATCH_SIZE || i === 100) {
        const created = await User.insertMany(userObjects, { ordered: false });
        allUsers.push(...created);
        console.log(`👥 Created ${created.length} users (total ${allUsers.length})`);
        userObjects = []; // reset for next batch
      }
    }

    console.log(`✅ Total users in DB: ${allUsers.length}`);

    // -------------------- CREATE RANDOM FOLLOWS --------------------
    console.log('🔄 Creating follow relationships...');
    for (const user of allUsers) {
      const numFollows = rand(2, 7);
      const potentialFollows = allUsers.filter(u => u._id.toString() !== user._id.toString());
      const shuffled = [...potentialFollows];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const toFollow = shuffled.slice(0, numFollows);
      for (const followee of toFollow) {
        if (!user.following.includes(followee._id)) {
          user.following.push(followee._id);
          user.followingCount++;
          followee.followers.push(user._id);
          followee.followersCount++;
        }
      }
    }
    await Promise.all(allUsers.map(u => u.save()));
    console.log('🤝 Follow relationships established');

    // -------------------- CREATE POSTS (1–3 per user) --------------------
    const allPosts = [];
    let postCounter = 0;
    for (const author of allUsers) {
      const numPosts = rand(1, 3);
      for (let p = 0; p < numPosts; p++) {
        const content = generatePostContent();
        const hashtags = Post.extractHashtags(content);
        const post = new Post({
          content,
          visibility: 'public',
          author: author._id,
          hashtags,
          likes: [],
          likesCount: 0,
          commentsCount: 0
        });
        await post.save();
        allPosts.push(post);
        postCounter++;
        author.postsCount++;
        await author.save();

        for (const tag of hashtags) {
          await Hashtag.findOneAndUpdate(
            { tag },
            { $inc: { postsCount: 1, recentPosts: 1 }, lastUsed: new Date() },
            { upsert: true }
          );
        }
      }
    }
    console.log(`📝 Created ${postCounter} posts`);

    // -------------------- ADD LIKES --------------------
    console.log('❤️ Adding random likes...');
    for (const post of allPosts) {
      const possibleLikers = allUsers.filter(u => u._id.toString() !== post.author.toString());
      const numLikes = rand(3, Math.min(15, possibleLikers.length));
      const shuffled = [...possibleLikers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const likers = shuffled.slice(0, numLikes);
      post.likes = likers.map(u => u._id);
      post.likesCount = likers.length;
      await post.save();
    }

    // -------------------- ADD COMMENTS --------------------
    const commentTexts = [
      'Awesome post! 🔥', 'Love this!', 'So true 👏', 'Thanks for sharing', 'Great perspective',
      'I totally agree', 'Inspiring!', 'Keep it up 💪', 'This made my day', 'Wonderful!',
      'Could not agree more', 'Well said', '🔥🔥🔥', 'Amazing content', 'Brilliant'
    ];
    let commentsCount = 0;
    for (const post of allPosts) {
      if (Math.random() < 0.7) {
        const numComments = rand(1, 5);
        for (let c = 0; c < numComments; c++) {
          const randomAuthor = allUsers[Math.floor(Math.random() * allUsers.length)];
          const comment = new Comment({
            post: post._id,
            author: randomAuthor._id,
            content: commentTexts[Math.floor(Math.random() * commentTexts.length)]
          });
          await comment.save();
          commentsCount++;
          post.commentsCount++;
        }
        await post.save();
      }
    }
    console.log(`💬 Created ${commentsCount} comments`);

    // -------------------- FINAL SUMMARY --------------------
    console.log('\n✅ Seed complete!');
    console.log(`   👥 ${allUsers.length} users created`);
    console.log(`   📝 ${allPosts.length} posts created (all public)`);
    console.log(`   💬 ${commentsCount} comments`);
    console.log('\n📋 Sample login credentials:');
    console.log('   Admin:  user1@teamagi.social  / Test123!');
    console.log('   User:   user50@teamagi.social / Test123!');
    console.log('\n🔓 All posts are PUBLIC – every user can see every post');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

run();