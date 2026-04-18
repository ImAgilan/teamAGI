// utils/connect-followers-to-agilan.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the existing user "agilan"
    const agilan = await User.findOne({ username: 'agilan' });
    if (!agilan) {
      console.error('❌ User "agilan" not found. Please create it first.');
      process.exit(1);
    }
    console.log(`👤 Found agilan: ${agilan.displayName} (${agilan._id})`);

    // Find all seeded users (user_1 to user_100) – adjust if your usernames differ
    const seededUsers = await User.find({ username: { $regex: /^user_\d+$/ } });
    console.log(`📋 Found ${seededUsers.length} seeded users`);

    // Filter out agilan itself (in case it was also seeded, but likely not)
    const followersToAdd = seededUsers.filter(u => u._id.toString() !== agilan._id.toString());
    console.log(`👥 Will add ${followersToAdd.length} followers to agilan`);

    // For each seeded user, add agilan to their following list (if not already)
    let updatedCount = 0;
    for (const user of followersToAdd) {
      if (!user.following.includes(agilan._id)) {
        user.following.push(agilan._id);
        user.followingCount = (user.followingCount || 0) + 1;
        await user.save();
        updatedCount++;
      }
    }
    console.log(`✅ ${updatedCount} users now follow agilan`);

    // Add all followers to agilan's followers list
    const newFollowers = followersToAdd.map(u => u._id);
    const existingFollowers = agilan.followers.map(id => id.toString());
    const reallyNew = newFollowers.filter(id => !existingFollowers.includes(id.toString()));

    if (reallyNew.length) {
      agilan.followers.push(...reallyNew);
      agilan.followersCount = (agilan.followersCount || 0) + reallyNew.length;
      await agilan.save();
      console.log(`✅ agilan now has ${agilan.followersCount} followers`);
    } else {
      console.log('ℹ️ agilan already had all these followers');
    }

    console.log('\n🎉 Done! All seeded users now follow @agilan');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();