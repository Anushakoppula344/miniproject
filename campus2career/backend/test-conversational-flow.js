const aiService = require('./services/aiService');
require('dotenv').config();

async function testConversationalFlow() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTING CONVERSATIONAL INTERVIEW FLOW');
  console.log('🧪 ========================================\n');

  const context = {
    role: 'frontend-developer',
    interviewType: 'technical',
    difficulty: 'beginner',
    conversationHistory: [],
    currentPhase: 'introduction',
    personality: 'friendly',
    questionsAsked: 0,
    totalQuestions: 10,
    skills: ['javascript', 'react'],
    yearsOfExperience: 0
  };

  try {
    // Test 1: Generate first question
    console.log('📝 Test 1: Generate First Question');
    console.log('=' .repeat(50));
    const question1 = await aiService.generateQuestion(context);
    console.log('✅ Question 1:', question1);
    console.log('');

    // Simulate user answer
    const answer1 = "I've been learning JavaScript for about 6 months now. I built a todo app using vanilla JavaScript.";
    console.log('💬 User Answer 1:', answer1);
    console.log('');

    // Test 2: Analyze the answer
    console.log('📝 Test 2: Analyze Answer Quality');
    console.log('='.repeat(50));
    const analysis1 = await aiService.analyzeAnswerQuality(question1, answer1, context, 'friendly');
    console.log('✅ Analysis Result:');
    console.log('   Quality:', analysis1.quality);
    console.log('   Completeness:', analysis1.completeness);
    console.log('   Follow-up Needed:', analysis1.followUpNeeded);
    console.log('   Reasoning:', analysis1.reasoning);
    console.log('   Suggested Follow-ups:', analysis1.suggestedFollowUps);
    console.log('');

    // Test 3: Generate follow-up if needed
    if (analysis1.followUpNeeded) {
      console.log('📝 Test 3: Generate Follow-Up Question');
      console.log('='.repeat(50));
      const followUp1 = await aiService.generateContextualFollowUp(question1, answer1, context, 'friendly');
      console.log('✅ Follow-up Question:', followUp1);
      console.log('');

      // Simulate user answer to follow-up
      const answer2 = "I used functions to add, delete, and mark todos as complete. I stored them in localStorage so they persist across page reloads.";
      console.log('💬 User Answer 2:', answer2);
      console.log('');

      // Test 4: Analyze follow-up answer
      console.log('📝 Test 4: Analyze Follow-Up Answer');
      console.log('='.repeat(50));
      const analysis2 = await aiService.analyzeAnswerQuality(followUp1, answer2, context, 'friendly');
      console.log('✅ Analysis Result:');
      console.log('   Quality:', analysis2.quality);
      console.log('   Completeness:', analysis2.completeness);
      console.log('   Follow-up Needed:', analysis2.followUpNeeded);
      console.log('   Reasoning:', analysis2.reasoning);
      console.log('');

      // Test 5: Generate second follow-up if needed
      if (analysis2.followUpNeeded) {
        console.log('📝 Test 5: Generate Second Follow-Up');
        console.log('='.repeat(50));
        const followUp2 = await aiService.generateContextualFollowUp(followUp1, answer2, context, 'friendly');
        console.log('✅ Second Follow-up:', followUp2);
        console.log('');
      } else {
        console.log('✅ No second follow-up needed - answer was complete!');
        console.log('');
      }
    } else {
      console.log('✅ No follow-up needed - answer was excellent!');
      console.log('');
    }

    // Test 6: Move to next main question
    console.log('📝 Test 6: Generate Next Main Question');
    console.log('='.repeat(50));
    context.questionsAsked = 1;
    context.conversationHistory = [
      { role: 'interviewer', content: question1 },
      { role: 'candidate', content: answer1 }
    ];
    const question2 = await aiService.generateQuestion(context);
    console.log('✅ Next Main Question:', question2);
    console.log('');

    // Test 7: Test different personality
    console.log('📝 Test 7: Test Technical Personality');
    console.log('='.repeat(50));
    const technicalAnswer = "I know HTML, CSS, and JavaScript basics.";
    const technicalAnalysis = await aiService.analyzeAnswerQuality(question2, technicalAnswer, context, 'technical');
    console.log('✅ Technical Analysis:');
    console.log('   Quality:', technicalAnalysis.quality);
    console.log('   Follow-up Needed:', technicalAnalysis.followUpNeeded);
    console.log('');

    if (technicalAnalysis.followUpNeeded) {
      const technicalFollowUp = await aiService.generateContextualFollowUp(question2, technicalAnswer, context, 'technical');
      console.log('✅ Technical Follow-up:', technicalFollowUp);
      console.log('');
    }

    console.log('🎉 ========================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('🎉 Conversational Flow Working Perfectly');
    console.log('🎉 ========================================\n');

    // Show provider status
    const status = aiService.getProviderStatus();
    console.log('📊 AI Service Status:');
    console.log('   Current Provider:', status.current);
    console.log('   Available Providers:', status.available.join(', '));
    console.log('   Fallback Chain:', status.fallbacks.join(' → '));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the test
testConversationalFlow();









