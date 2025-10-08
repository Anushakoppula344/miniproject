const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
console.log('🔧 [AI SERVICE] Initializing Google Generative AI...');
console.log('🔑 [AI SERVICE] API Key from environment:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');
console.log('✅ [AI SERVICE] Google Generative AI initialized successfully');

// Interviewer personalities
const interviewerPersonalities = {
  friendly: {
    tone: 'warm and encouraging',
    questionStyle: 'conversational and supportive',
    phrases: ['That\'s great!', 'I\'d love to hear more about that', 'That sounds interesting', 'Tell me more']
  },
  professional: {
    tone: 'formal and structured',
    questionStyle: 'direct and methodical',
    phrases: ['Please elaborate', 'Can you provide more details', 'That\'s helpful', 'I understand']
  },
  technical: {
    tone: 'focused and analytical',
    questionStyle: 'detailed and probing',
    phrases: ['How exactly did you implement that?', 'What were the technical challenges?', 'Can you walk me through the process?']
  }
};

class AIService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async generateQuestion(context) {
    console.log('🤖 [AI SERVICE] Generating question with context:', context);
    
    const {
      role,
      interviewType,
      difficulty,
      conversationHistory,
      currentPhase,
      personality,
      questionsAsked,
      totalQuestions,
      skills,
      yearsOfExperience
    } = context;

    try {
      const personalityConfig = interviewerPersonalities[personality] || interviewerPersonalities.friendly;
      
      // Build conversation context
      let conversationContext = '';
      if (conversationHistory && conversationHistory.length > 0) {
        conversationContext = conversationHistory.map(entry => 
          `${entry.type === 'question' ? 'Interviewer' : 'Candidate'}: ${entry.content}`
        ).join('\n');
      }

      const prompt = `
You are a professional interviewer conducting a ${interviewType} interview for a ${role} position.

Your personality: ${personalityConfig.tone}
Your style: ${personalityConfig.questionStyle}
Your phrases: ${personalityConfig.phrases.join(', ')}

Interview Context:
- Role: ${role}
- Type: ${interviewType}
- Difficulty: ${difficulty}
- Current Phase: ${currentPhase}
- Questions Asked: ${questionsAsked}/${totalQuestions}
- Candidate Experience: ${yearsOfExperience || 0} years
- Key Skills/Technologies: ${skills && skills.length > 0 ? skills.join(', ') : 'General'}

${conversationContext ? `Previous Conversation:\n${conversationContext}\n` : ''}

CRITICAL INSTRUCTIONS:
1. NEVER repeat the same question that was already asked
2. Analyze the candidate's previous answers to ask relevant follow-up questions
3. If the candidate gave a brief answer, ask for more details
4. If the candidate mentioned specific technologies/projects, ask about them
5. Progress naturally through interview phases based on questions asked
6. Make each question build on the conversation naturally

Interview Flow Strategy:
- Questions 1-2: Introduction and background
- Questions 3-5: Technical skills and experience
- Questions 6-8: Behavioral and problem-solving
- Questions 9-10: Closing and candidate questions

Based on the conversation so far, decide what to ask next:

1. If this is the first question (${questionsAsked === 0}), start with an introduction
2. If the candidate just answered, analyze their response and either:
   - Ask a follow-up question to dig deeper into their answer
   - Ask a new question on a different but related topic
   - Move to the next phase of the interview
3. Consider what you still need to learn about the candidate
4. Make it feel like a natural, flowing conversation

Guidelines:
- Keep questions clear and specific
- Make them relevant to the ${role} position
- Ensure appropriate difficulty for ${difficulty} level (${yearsOfExperience || 0} years experience)
- Focus on these skills/technologies: ${skills && skills.length > 0 ? skills.join(', ') : 'general skills'}
- Use your ${personalityConfig.tone} tone
- NEVER repeat questions already asked - check the conversation history carefully
- Make it feel like a natural conversation
- Tailor questions to their experience level
- If the candidate just answered a question, ask a follow-up or move to a new topic
- Progress through different aspects of the role (technical skills, experience, problem-solving, etc.)

CRITICAL: Review the conversation history above and ensure your next question is completely different from any previous questions. Do not ask the same question twice.

Return only the next question to ask, no additional text or formatting.
`;

      console.log('📤 [AI SERVICE] Sending prompt to Gemini API...');
      const result = await this.model.generateContent(prompt);
      const nextQuestion = result.response.text().trim();
      
      console.log('✅ [AI SERVICE] Question generated:', nextQuestion);
      return nextQuestion;

    } catch (error) {
      console.error('❌ [AI SERVICE] Error generating question:', error);
      
      // Fallback questions
    const fallbackQuestions = {
      introduction: [
        `Hello! I'm excited to learn more about your background. Can you tell me about yourself and what interests you about ${role} positions?`,
          `Welcome! Let's start with you telling me about your experience in ${role} and what brings you here today.`
      ],
      technical: [
        `Can you walk me through a challenging ${role} project you've worked on recently?`,
          `How would you approach solving a complex problem in your field?`
      ],
      behavioral: [
        `Tell me about a time when you had to work with a difficult team member. How did you handle it?`,
          `Describe a situation where you had to learn something new quickly. How did you approach it?`
      ],
      closing: [
        `Do you have any questions about the role or our company?`,
          `What are you looking for in your next position?`
        ]
      };

      const phaseQuestions = fallbackQuestions[currentPhase] || fallbackQuestions.introduction;
      const selectedQuestion = phaseQuestions[Math.floor(Math.random() * phaseQuestions.length)];
      
      console.log('🔄 [AI SERVICE] Using fallback question:', selectedQuestion);
      return selectedQuestion;
    }
  }

  async generateContextualFollowUp(originalQuestion, userAnswer, context, personality) {
    console.log('🤖 [AI SERVICE] Generating contextual follow-up...');
    
    try {
      const personalityConfig = interviewerPersonalities[personality] || interviewerPersonalities.friendly;

    const prompt = `
You are a professional interviewer conducting a ${context.interviewType} interview for a ${context.role} position.

Your personality: ${personalityConfig.tone}
Your style: ${personalityConfig.questionStyle}

Original Question: "${originalQuestion}"
Candidate's Answer: "${userAnswer}"

Based on the candidate's answer, generate a natural follow-up question that:
1. Digs deeper into their response
2. Asks for specific examples or details
3. Explores related aspects they mentioned
4. Feels like a natural conversation flow
5. Is relevant to the ${context.role} position

Guidelines:
- Keep it conversational and natural
- Use your ${personalityConfig.tone} tone
- Don't repeat the original question
- Make it specific to what they said
- Keep it relevant to the role

Return only the follow-up question, no additional text.
`;

      const result = await this.model.generateContent(prompt);
      const followUpQuestion = result.response.text().trim();
      
      console.log('✅ [AI SERVICE] Follow-up question generated:', followUpQuestion);
      return followUpQuestion;

    } catch (error) {
      console.error('❌ [AI SERVICE] Error generating follow-up:', error);
      return "Can you tell me more about that?";
    }
  }

  async analyzeAnswerQuality(question, answer, context, personality) {
    console.log('🤖 [AI SERVICE] Analyzing answer quality...');
    
    try {
      const prompt = `
Analyze the quality of this interview answer:

Question: "${question}"
Answer: "${answer}"
Role: ${context.role}
Interview Type: ${context.interviewType}
Difficulty: ${context.difficulty}

Rate the answer on:
1. Completeness (1-10): How well did they answer the question?
2. Relevance (1-10): How relevant is their answer to the role?
3. Depth (1-10): How detailed and thoughtful is their response?
4. Clarity (1-10): How clear and well-structured is their answer?

Return as JSON:
{
  "quality": 8,
  "completeness": 7,
  "relevance": 9,
  "depth": 6,
  "clarity": 8,
  "followUpNeeded": true,
  "feedback": "Good answer, but could use more specific examples",
  "suggestions": ["Ask for specific examples", "Probe deeper into their experience"]
}
`;

      const result = await this.model.generateContent(prompt);
      const analysisText = result.response.text().trim();
      
      // Clean and parse JSON response
      let cleanedText = analysisText;
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysis = JSON.parse(cleanedText);
      
      console.log('✅ [AI SERVICE] Answer analysis completed:', analysis);
      return analysis;

    } catch (error) {
      console.error('❌ [AI SERVICE] Error analyzing answer:', error);
      
      // Fallback analysis
    return {
        quality: 6,
        completeness: 6,
        relevance: 7,
        depth: 5,
        clarity: 6,
        followUpNeeded: true,
        feedback: 'Answer received, continuing interview',
        suggestions: ['Ask for more details', 'Request specific examples']
      };
    }
  }
}

module.exports = new AIService();