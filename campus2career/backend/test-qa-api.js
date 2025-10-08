const mongoose = require('mongoose');
const Question = require('./models/Question');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mock-interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

async function testQAAPI() {
  try {
    console.log('🧪 Testing Q&A API...\n');

    // Test 1: Create a sample question
    console.log('1. Creating a sample question...');
    const sampleQuestion = new Question({
      title: 'How to prepare for Google technical interviews?',
      content: 'I have a technical interview at Google next week for a Software Engineer position. What are the best resources and strategies to prepare effectively?',
      author: new mongoose.Types.ObjectId(),
      authorName: 'Test User',
      authorEmail: 'test@example.com',
      category: 'Technical',
      tags: ['Google', 'Technical Interview', 'Preparation']
    });

    const savedQuestion = await sampleQuestion.save();
    console.log('✅ Question created:', savedQuestion.title);

    // Test 2: Add an answer
    console.log('\n2. Adding an answer...');
    const answerData = {
      content: 'For Google technical interviews, I recommend focusing on algorithms and data structures from LeetCode. Practice system design questions and be ready to explain your thought process clearly.',
      author: new mongoose.Types.ObjectId(),
      authorName: 'Helper User',
      authorEmail: 'helper@example.com'
    };

    await savedQuestion.addAnswer(answerData);
    console.log('✅ Answer added');

    // Test 3: Test like functionality
    console.log('\n3. Testing like functionality...');
    const userId = new mongoose.Types.ObjectId();
    await savedQuestion.toggleLike(userId);
    console.log('✅ Like toggled, like count:', savedQuestion.likeCount);

    // Test 4: Test bookmark functionality
    console.log('\n4. Testing bookmark functionality...');
    await savedQuestion.toggleBookmark(userId);
    console.log('✅ Bookmark toggled, bookmark count:', savedQuestion.bookmarkCount);

    // Test 5: Test search functionality
    console.log('\n5. Testing search functionality...');
    const searchResults = await Question.search('Google technical interview');
    console.log('✅ Search results:', searchResults.length, 'questions found');

    // Test 6: Test category filtering
    console.log('\n6. Testing category filtering...');
    const technicalQuestions = await Question.find({ category: 'Technical' });
    console.log('✅ Technical questions found:', technicalQuestions.length);

    // Test 7: Test popular questions
    console.log('\n7. Testing popular questions...');
    const popularQuestions = await Question.getPopular(5);
    console.log('✅ Popular questions:', popularQuestions.length);

    // Test 8: Test recent questions
    console.log('\n8. Testing recent questions...');
    const recentQuestions = await Question.getRecent(5);
    console.log('✅ Recent questions:', recentQuestions.length);

    // Test 9: Test category statistics
    console.log('\n9. Testing category statistics...');
    const stats = await Question.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('✅ Category statistics:', stats);

    console.log('\n🎉 All Q&A API tests passed!');
    console.log('\n📊 Sample Question Data:');
    console.log('- Title:', savedQuestion.title);
    console.log('- Category:', savedQuestion.category);
    console.log('- Tags:', savedQuestion.tags);
    console.log('- Answers:', savedQuestion.answerCount);
    console.log('- Likes:', savedQuestion.likeCount);
    console.log('- Bookmarks:', savedQuestion.bookmarkCount);
    console.log('- Views:', savedQuestion.views);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await Question.deleteMany({ authorName: 'Test User' });
    console.log('\n🧹 Cleaned up test data');
    mongoose.connection.close();
  }
}

// Run the test
testQAAPI();

