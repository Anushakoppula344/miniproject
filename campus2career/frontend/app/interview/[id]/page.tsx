'use client';

import { useState, useEffect, useRef, use } from 'react';
import { apiCall } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Question {
  question: string;
  answer: string;
  transcript: string;
  timeSpent: number;
}

interface Interview {
  _id: string;
  title: string;
  role: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  questions: Question[];
  status: string;
  conversationHistory?: Array<{
    type: 'question' | 'answer';
    content: string;
    timestamp: Date;
  }>;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  profilePicture?: string;
}

interface TranscriptItem {
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptItem[]>([]);
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [isQuestionAnimating, setIsQuestionAnimating] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [isGettingNextQuestion, setIsGettingNextQuestion] = useState(false);
  const [answerAnalysis, setAnswerAnalysis] = useState<any>(null);
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState(false);
  const [isInFollowUpMode, setIsInFollowUpMode] = useState(false);
  // Helper function to calculate text similarity
  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(' ').filter(word => word.length > 2);
    const words2 = str2.split(' ').filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };

  const [followUpDepth, setFollowUpDepth] = useState(0);
  const [recentQuestions, setRecentQuestions] = useState<string[]>([]);
  const [maxFollowUpDepth] = useState(3);
  const [userPerformance, setUserPerformance] = useState({
    avgScore: 0,
    strengths: [] as string[],
    weaknesses: [] as string[],
    improvementAreas: [] as string[]
  });
  const [currentPersonality, setCurrentPersonality] = useState('friendly');
  const [isUpdatingPersonality, setIsUpdatingPersonality] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [conversationContext, setConversationContext] = useState<string[]>([]);
  const [isHandlingInterruption, setIsHandlingInterruption] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string>('');
  const [voiceAnalysis, setVoiceAnalysis] = useState<any>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAnswerRef = useRef<string>(''); // Add ref to track current answer
  const isGettingNextQuestionRef = useRef<boolean>(false); // Use ref to prevent race conditions

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Initialize speech APIs
    initializeSpeechAPIs();
    fetchUserData();
    fetchInterview();
    
    return () => {
      cleanup();
    };
  }, [resolvedParams.id, router]);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('👤 User data loaded from localStorage:', parsedUser);
        console.log('👤 Profile picture path:', parsedUser.profilePicture);
        console.log('👤 Full profile picture URL:', parsedUser.profilePicture ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${parsedUser.profilePicture}` : 'No profile picture');
        
        // If no profile picture in localStorage, try to fetch fresh user data
        if (!parsedUser.profilePicture) {
          console.log('👤 No profile picture in localStorage, fetching fresh user data...');
          await fetchFreshUserData();
        }
      } else {
        console.log('👤 No user data in localStorage, fetching from API...');
        await fetchFreshUserData();
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    }
  };

  const fetchFreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiCall('/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const userData = data.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('👤 Fresh user data fetched:', userData);
          console.log('👤 Fresh profile picture path:', userData.profilePicture);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching fresh user data:', error);
    }
  };

  const getNextQuestionFromAI = async () => {
    // Prevent duplicate calls using ref (immediate, no re-render delay)
    if (isGettingNextQuestionRef.current) {
      console.log('⚠️ [FRONTEND] Already getting next question, skipping duplicate call');
      console.log('⚠️ [FRONTEND] isGettingNextQuestionRef.current:', isGettingNextQuestionRef.current);
      return;
    }
    
    console.log('🤖 [FRONTEND] Getting next question from Gemini AI...');
    console.log('🔒 [FRONTEND] Setting isGettingNextQuestion flag to true (ref)');
    isGettingNextQuestionRef.current = true; // Use ref for immediate effect
    setIsGettingNextQuestion(true); // Also update state for UI
    
    console.log('📊 [FRONTEND] Current conversation context:', conversationContext);
    console.log('📊 [FRONTEND] Current interview state:', interview);
    console.log('📊 [FRONTEND] Interview conversation history:', interview?.conversationHistory);
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 [FRONTEND] Token available:', !!token);
      
      // Use interview's conversation history if available, otherwise use local conversationContext
      const effectiveConversationHistory = interview?.conversationHistory && interview.conversationHistory.length > 0 
        ? interview.conversationHistory 
        : conversationContext.map(item => ({
            type: item.startsWith('Q:') ? 'question' : 'answer',
            content: item.replace(/^[QA]:\s*/, ''),
            timestamp: new Date()
          }));
      
      console.log('💬 [FRONTEND] Effective conversation history:', effectiveConversationHistory);
      console.log('💬 [FRONTEND] History length:', effectiveConversationHistory.length);
      
      const requestBody = {
        conversationHistory: effectiveConversationHistory,
        currentPhase: 'introduction' // This could be dynamic based on interview progress
      };
      
      console.log('📤 [FRONTEND] Sending request to backend:', {
        url: `/api/interviews/${resolvedParams.id}/get-next-question`,
        method: 'POST',
        body: requestBody
      });
      
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/get-next-question`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [FRONTEND] Response status:', response.status);
      console.log('📥 [FRONTEND] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FRONTEND] Next question from AI received:', data);
        console.log('📝 [FRONTEND] Question text:', data.data.question);
        console.log('📊 [FRONTEND] Question index:', data.data.questionIndex);
        console.log('📊 [FRONTEND] Total questions:', data.data.totalQuestions);
        console.log('💬 [FRONTEND] Conversation history length:', data.data.conversationHistory?.length);
        
        // Update interview with the new question
        console.log('🔄 [FRONTEND] Updating interview state...');
        setInterview(prev => {
          if (!prev) {
            console.log('⚠️ [FRONTEND] Previous interview state is null, cannot update');
            setError('Interview state lost. Please refresh the page.');
            return prev;
          }
          console.log('📊 [FRONTEND] Previous interview state:', prev);
          const updated = {
            ...prev,
            currentQuestion: {
              question: data.data.question,
              answer: '',
              transcript: '',
              timeSpent: 0
            },
            currentQuestionIndex: data.data.questionIndex,
            conversationHistory: data.data.conversationHistory || prev.conversationHistory || []
          };
          console.log('📊 [FRONTEND] Updated interview state:', updated);
          console.log('💬 [FRONTEND] Updated conversation history:', updated.conversationHistory);
          return updated;
        });
        
        // Speak the question
        console.log('🎤 [FRONTEND] Scheduling question to be spoken immediately...');
        setTimeout(() => {
          console.log('🎤 [FRONTEND] Speaking question:', data.data.question);
          speakText(data.data.question);
          console.log('⏱️ [FRONTEND] Starting timer...');
          startTimer();
        }, 200); // Reduced delay for smoother flow
        
      } else {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Failed to get next question from AI');
        console.error('❌ [FRONTEND] Response status:', response.status);
        console.error('❌ [FRONTEND] Response text:', errorText);
        setError('Failed to get next question from AI');
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error getting next question from AI:', error);
      console.error('❌ [FRONTEND] Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        name: (error as Error).name
      });
      setError('Error getting next question from AI');
    } finally {
      console.log('🏁 [FRONTEND] Finished getting next question from AI');
      isGettingNextQuestionRef.current = false; // Reset ref
      setIsGettingNextQuestion(false); // Reset state
    }
  };

  const initializeSpeechAPIs = () => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        console.log('🎤 Speech recognition result:');
        console.log('🎤 Final transcript:', `"${finalTranscript}"`);
        console.log('🎤 Interim transcript:', `"${interimTranscript}"`);
        
        // Check for interruption commands
        const interruptionCommands = ['stop', 'wait', 'hold on', 'let me', 'excuse me', 'sorry'];
        const hasInterruptionCommand = [...interimTranscript, ...finalTranscript]
          .some(text => interruptionCommands.some(cmd => text.toLowerCase().includes(cmd)));
        
        if (hasInterruptionCommand && isSpeaking) {
          console.log('🛑 Interruption command detected:', interimTranscript || finalTranscript);
          handleInterruption();
          return;
        }
        
        // Update the current answer with the final transcript
        if (finalTranscript) {
          console.log('🎤 Updating current answer with final transcript');
          setCurrentAnswer(prev => {
            const newAnswer = prev + finalTranscript;
            currentAnswerRef.current = newAnswer; // Update ref
            console.log('🎤 Previous answer:', `"${prev}"`);
            console.log('🎤 Final transcript to add:', `"${finalTranscript}"`);
            console.log('🎤 New current answer:', `"${newAnswer}"`);
            console.log('🎤 Current answer ref updated to:', `"${currentAnswerRef.current}"`);
            return newAnswer;
          });
          setTranscript(finalTranscript);
          // Reset silence timer when user speaks
          resetSilenceTimer();
          
          // Analyze voice emotion
          analyzeVoiceEmotion(finalTranscript);
        }
        
        // Show interim results in the live transcript
        if (interimTranscript) {
          console.log('🎤 Updating live transcript with interim results');
        setTranscript(interimTranscript);
          // Reset silence timer for any speech activity
          resetSilenceTimer();
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
        setIsWaitingForUser(false); // Hide waiting state when recognition actually starts
      };

      recognitionRef.current.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onnomatch = () => {
        console.log('🔍 No speech was recognized');
      };
    } else {
      console.warn('⚠️ Speech recognition not supported in this browser');
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }

    // Initialize speech synthesis
      synthesisRef.current = window.speechSynthesis;
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  const fetchInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/interviews/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Interview data:', data.data.interview);
        console.log('📋 Interview status:', data.data.interview.status);
        console.log('📋 Current question:', data.data.interview.currentQuestion);
        setInterview(data.data.interview);
        
        // If interview is in progress, get the first question from Gemini AI
        if (data.data.interview.status === 'in-progress') {
          console.log('🎯 [FRONTEND] Interview in progress, getting first question from Gemini AI...');
          console.log('📊 [FRONTEND] Interview details:', {
            id: data.data.interview._id,
            status: data.data.interview.status,
            role: data.data.interview.role,
            interviewType: data.data.interview.interviewType,
            questionsCount: data.data.interview.questions ? data.data.interview.questions.length : 0
          });
          
          // Only get first question if no questions exist yet
          if (!data.data.interview.questions || data.data.interview.questions.length === 0) {
            console.log('🆕 [FRONTEND] No questions yet, getting first question from AI...');
            // Small delay to ensure UI is ready
          setTimeout(() => {
            console.log('⏰ [FRONTEND] Timeout reached, calling getNextQuestionFromAI...');
            getNextQuestionFromAI();
          }, 100); // Reduced delay for faster startup
          } else {
            console.log('📝 [FRONTEND] Questions already exist, not getting new question');
          }
        } else {
          console.log('⚠️ [FRONTEND] Interview not in progress. Status:', data.data.interview.status);
          setError(`Interview is not in progress. Current status: ${data.data.interview.status}`);
        }
      } else {
        setError('Failed to fetch interview details');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startSilenceTimer = () => {
    // Clear existing silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    // Start new silence timer (5 seconds of silence)
    silenceTimerRef.current = setTimeout(() => {
      console.log('🔇 Long silence detected, auto-submitting answer...');
      console.log('🔇 Current answer (ref):', `"${currentAnswerRef.current}"`);
      console.log('🔇 Current answer (ref) length:', currentAnswerRef.current.length);
      console.log('🔇 Current answer (ref) trimmed:', `"${currentAnswerRef.current.trim()}"`);
      console.log('🔇 Current answer (ref) trimmed length:', currentAnswerRef.current.trim().length);
      console.log('🔇 Current answer (state):', `"${currentAnswer}"`);
      console.log('🔇 Current answer (state) length:', currentAnswer.length);
      
      if (currentAnswerRef.current.trim()) {
        console.log('✅ Answer has content, submitting...');
        submitAnswer();
      } else {
        console.log('⚠️ Answer is empty, not submitting');
        setError('Please provide an answer. You can speak your response or type it manually.');
      }
    }, 3000); // Reduced to 3 seconds of silence for faster flow
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    startSilenceTimer();
  };


  const analyzeAnswer = async (question: string, answer: string) => {
    if (!question || !answer.trim()) {
      console.log('⚠️ Skipping answer analysis - missing question or answer');
      return;
    }
    
    console.log('🔍 Analyzing answer...');
    console.log('📝 Question:', question);
    console.log('💬 Answer:', answer);
    
    setIsAnalyzingAnswer(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/analyze-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Answer analysis completed:', data.data.analysis);
        
        setAnswerAnalysis(data.data.analysis);
        
        // Update user performance metrics
        updateUserPerformance(data.data.analysis);
        
      } else {
        console.error('❌ Failed to analyze answer');
      }
    } catch (error) {
      console.error('❌ Error analyzing answer:', error);
    } finally {
      setIsAnalyzingAnswer(false);
    }
  };

  const updateUserPerformance = (analysis: any) => {
    console.log('📊 [PERFORMANCE] Updating user performance with analysis:', analysis);
    
    setUserPerformance(prev => {
      // Safely extract strengths and improvements with defaults
      const analysisStrengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
      const analysisImprovements = Array.isArray(analysis.improvements) ? analysis.improvements : [];
      const analysisMissingInfo = Array.isArray(analysis.missingInformation) ? analysis.missingInformation : [];
      
      const newStrengths = [...new Set([...prev.strengths, ...analysisStrengths])];
      const newWeaknesses = [...new Set([...prev.weaknesses, ...analysisImprovements])];
      
      // Calculate average score safely
      let currentAvg = 7; // Default score
      if (analysis.scores && typeof analysis.scores === 'object') {
        const scores = Object.values(analysis.scores) as number[];
        if (scores.length > 0) {
          currentAvg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      }
      
      const newAvgScore = prev.avgScore === 0 ? currentAvg : (prev.avgScore + currentAvg) / 2;
      
      console.log('✅ [PERFORMANCE] Updated performance:', {
        avgScore: newAvgScore,
        strengthsCount: newStrengths.length,
        weaknessesCount: newWeaknesses.length
      });
      
      return {
        avgScore: newAvgScore,
        strengths: newStrengths,
        weaknesses: newWeaknesses,
        improvementAreas: analysisMissingInfo
      };
    });
  };

  // Enhanced conversational flow - decides whether to ask follow-up or move to next question
  const handleConversationalFlow = async (currentQuestion: string, userAnswer: string, analysis: any) => {
    console.log('\n🎯 ========================================');
    console.log('🎯 [CONVERSATION] Handling conversational flow');
    console.log('🎯 ========================================');
    console.log('📊 [CONVERSATION] Analysis:', {
      quality: analysis.quality,
      completeness: analysis.completeness,
      followUpNeeded: analysis.followUpNeeded
    });
    console.log('📊 [CONVERSATION] Current follow-up depth:', followUpDepth, '/', maxFollowUpDepth);
    console.log('📝 [CONVERSATION] Current question:', currentQuestion?.substring(0, 100) + '...');
    console.log('💬 [CONVERSATION] User answer:', userAnswer?.substring(0, 100) + '...');
    
    try {
      // Check if we should ask a follow-up question
      const shouldAskFollowUp = analysis.followUpNeeded && 
                                followUpDepth < maxFollowUpDepth &&
                                (analysis.quality === 'fair' || analysis.completeness === 'partial');
      
      console.log('🔍 [CONVERSATION] Decision criteria:', {
        followUpNeeded: analysis.followUpNeeded,
        depthAllowed: followUpDepth < maxFollowUpDepth,
        qualityCheck: analysis.quality === 'fair' || analysis.completeness === 'partial',
        shouldAskFollowUp
      });
      
      if (shouldAskFollowUp) {
        console.log('✅ [CONVERSATION] Decision: Generate follow-up question');
        setIsInFollowUpMode(true);
        
        const token = localStorage.getItem('token');
        const response = await apiCall(`/api/interviews/${resolvedParams.id}/generate-followup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            originalQuestion: currentQuestion,
            userAnswer: userAnswer
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const followUpQuestion = data.data.followUpQuestion;
          
          console.log('✅ [CONVERSATION] Follow-up question generated successfully!');
          console.log('💬 [CONVERSATION] Question:', followUpQuestion);
          console.log('📊 [CONVERSATION] Response data:', data);
          
          // Check if we've reached the maximum follow-up depth for this topic
          if (followUpDepth >= maxFollowUpDepth) {
            console.log('⚠️ [CONVERSATION] Maximum follow-up depth reached, moving to next question');
            setIsInFollowUpMode(false);
            setFollowUpDepth(0);
            setRecentQuestions([]); // Clear recent questions for new topic
            await getNextQuestionFromAI();
            return false;
          }
          
          // Check if this is the exact same question as the previous one
          if (recentQuestions.length > 0 && followUpQuestion === recentQuestions[0]) {
            console.log('⚠️ [CONVERSATION] Exact same question as previous, moving to next question');
            setIsInFollowUpMode(false);
            // Don't reset followUpDepth here - let it reset when moving to next topic
            await getNextQuestionFromAI();
            return false;
          }
          
          // Check if this question was asked recently (last 3 questions)
          const isRecentQuestion = recentQuestions.some(recentQ => {
            const similarity = calculateSimilarity(followUpQuestion.toLowerCase(), recentQ.toLowerCase());
            return similarity > 0.7; // 70% similarity threshold
          });
          
          if (isRecentQuestion) {
            console.log('⚠️ [CONVERSATION] Follow-up question was asked recently, moving to next question');
            setIsInFollowUpMode(false);
            // Don't reset followUpDepth here - let it reset when moving to next topic
            await getNextQuestionFromAI();
            return false;
          }
          
          // Update recent questions tracking
          setRecentQuestions(prev => {
            const updated = [followUpQuestion, ...prev].slice(0, 3); // Keep last 3 questions
            console.log('📝 [CONVERSATION] Updated recent questions:', updated);
            return updated;
          });
          
          // Increment follow-up depth
          const newDepth = followUpDepth + 1;
          setFollowUpDepth(newDepth);
          console.log('📈 [CONVERSATION] Follow-up depth increased to:', newDepth);
          
          // Add follow-up to transcript history
          setTranscriptHistory(prev => [...prev, {
            type: 'question',
            content: followUpQuestion,
            timestamp: new Date()
          }]);
          
          // Update interview state with follow-up question
          console.log('🔄 [CONVERSATION] Updating interview state with follow-up question...');
          setInterview(prev => {
            if (!prev) {
              console.error('❌ [CONVERSATION] Previous interview state is null!');
              return prev;
            }
            const updated = {
              ...prev,
              currentQuestion: {
                question: followUpQuestion,
                answer: '',
                transcript: '',
                timeSpent: 0
              },
              currentQuestionIndex: prev.currentQuestionIndex + 1 // Increment for follow-up
            };
            console.log('📊 [CONVERSATION] Updated interview state:', updated);
            return updated;
          });
          
          // Display and speak the follow-up question
          setDisplayedQuestion('');
          setIsQuestionAnimating(true);
          animateQuestionText(followUpQuestion);
          
          setTimeout(() => {
            speakText(followUpQuestion);
          }, 200); // Reduced delay for smoother flow
          
          console.log('🎤 [CONVERSATION] Follow-up question displayed and queued for speech');
          return true; // Follow-up was asked
        } else {
          console.error('❌ [CONVERSATION] Failed to generate follow-up:', response.status);
          const errorData = await response.json();
          console.error('📛 [CONVERSATION] Error details:', errorData);
          
          // Fallback: Move to next main question if follow-up fails
          console.log('🔄 [CONVERSATION] Falling back to next main question due to follow-up failure');
          setIsInFollowUpMode(false);
          // Don't reset followUpDepth here - let it reset when moving to next topic
          await getNextQuestionFromAI();
        }
      }
      
      // If no follow-up needed or quality is excellent, move to next main question
      console.log('✅ [CONVERSATION] Decision: Move to next main question');
      console.log('📊 [CONVERSATION] Reason:', 
        !analysis.followUpNeeded ? 'No follow-up needed' : 
        followUpDepth >= maxFollowUpDepth ? 'Max depth reached' : 
        'Answer quality is good'
      );
      
      // Wait a bit for conversation context to be updated, then move to next main question
      setTimeout(async () => {
        console.log('🔄 [CONVERSATION] Moving to next main question after context update...');
        
        // Reset follow-up tracking AFTER moving to next question
        console.log('🔄 [CONVERSATION] Resetting follow-up tracking for next topic');
        setIsInFollowUpMode(false);
        setFollowUpDepth(0);
        setRecentQuestions([]); // Clear recent questions for new topic
        
        await getNextQuestionFromAI();
      }, 50); // Reduced delay for smoother flow
      
      return false; // No follow-up, moved to next question
      
    } catch (error: any) {
      console.error('\n❌ ========================================');
      console.error('❌ [CONVERSATION ERROR] Failed');
      console.error('❌ ========================================');
      console.error('📛 Error name:', error.name);
      console.error('📛 Error message:', error.message);
      console.error('📛 Stack trace:', error.stack);
      
      // Fallback to next main question
      console.log('🔄 [CONVERSATION] Falling back to next main question');
      setIsInFollowUpMode(false);
      // Don't reset followUpDepth here - let it reset when moving to next topic
      await getNextQuestionFromAI();
      return false;
    }
  };

  const updatePersonality = async (newPersonality: string) => {
    console.log('🎭 Updating interviewer personality to:', newPersonality);
    setIsUpdatingPersonality(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/personality`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personality: newPersonality
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Personality updated:', data.data.personality);
        setCurrentPersonality(data.data.personality);
      } else {
        console.error('❌ Failed to update personality');
      }
    } catch (error) {
      console.error('❌ Error updating personality:', error);
    } finally {
      setIsUpdatingPersonality(false);
    }
  };

  const analyzeVoiceEmotion = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    console.log('🎭 Analyzing voice emotion for:', transcript);
    setIsAnalyzingVoice(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/analyze-emotion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
          personality: currentPersonality
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Voice emotion analysis completed:', data.data.analysis);
        
        setVoiceAnalysis(data.data.analysis);
        setDetectedEmotion(data.data.analysis.emotion);
        
        // Adapt AI response based on detected emotion
        if (data.data.analysis.emotion === 'nervous' || data.data.analysis.emotion === 'anxious') {
          console.log('😰 User seems nervous, adapting to be more encouraging');
        } else if (data.data.analysis.emotion === 'confident') {
          console.log('😎 User seems confident, can increase difficulty');
        }
      } else {
        console.error('❌ Failed to analyze voice emotion');
      }
    } catch (error) {
      console.error('❌ Error analyzing voice emotion:', error);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

  const handleInterruption = () => {
    if (isSpeaking && !isHandlingInterruption) {
      console.log('🛑 User interrupted AI speaking');
      setIsHandlingInterruption(true);
      setIsInterrupted(true);
      
      // Stop AI speech immediately
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
        setIsSpeaking(false);
      }
      
      // Clear question animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
        setIsQuestionAnimating(false);
      }
      
      // Start listening for user input
      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          try {
            // Check if recognition is already running
            if (recognitionRef.current.state === 'running') {
              console.log('🎤 Speech recognition already running after interruption');
              return;
            }
            
            recognitionRef.current.start();
            console.log('🎤 Started listening after interruption');
          } catch (error) {
            console.log('🎤 Speech recognition start failed after interruption:', error);
          }
        }
        setIsHandlingInterruption(false);
      }, 500);
    }
  };

  const animateQuestionText = (text: string) => {
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    const words = text.split(' ');
    let currentIndex = 0;
    
    setIsQuestionAnimating(true);
    setDisplayedQuestion('');
    
    // Show first word immediately
    if (words.length > 0) {
      setDisplayedQuestion(words[0]);
      currentIndex = 1;
    }
    
    // Calculate timing based on speech rate (0.9 rate = slower speech)
    const baseDelay = 300; // Base delay per word
    const speechRate = 0.9; // Match the speech synthesis rate
    const delay = baseDelay / speechRate; // Adjust delay based on speech rate
    
    // Start animation for remaining words
    animationRef.current = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedQuestion(prev => prev + ' ' + words[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(animationRef.current!);
        setIsQuestionAnimating(false);
      }
    }, delay);
  };

  const speakText = (text: string) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        // Start animating the question text
        animateQuestionText(text);
        // Add question to transcript history when AI starts speaking
        setTranscriptHistory(prev => [...prev, {
          type: 'question',
          content: text,
          timestamp: new Date()
        }]);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        // Ensure full text is displayed when speech ends
        setDisplayedQuestion(text);
        setIsQuestionAnimating(false);
        
        // Start speech recognition AFTER AI finishes speaking (reduced delay for smoother flow)
        setTimeout(() => {
          console.log('🎤 Question ended, starting speech recognition...');
          setIsWaitingForUser(true); // Show waiting state
          
          if (recognitionRef.current && !isListening) {
            try {
              // Check if recognition is already running
              if (recognitionRef.current.state === 'running') {
                console.log('🎤 Speech recognition already running after question ended');
                setIsWaitingForUser(false);
                return;
              }
              
              recognitionRef.current.start();
              console.log('🎤 Started speech recognition after question ended');
              setIsWaitingForUser(false); // Hide waiting state when recognition starts
              
              // Start silence timer for auto-submit immediately
              console.log('🎤 Starting silence timer for auto-submit...');
              startSilenceTimer();
            } catch (error) {
              console.log('🎤 Speech recognition start failed:', error);
              setIsWaitingForUser(false); // Hide waiting state on error
            }
          }
        }, 1500); // Reduced to 1.5 seconds for smoother flow
      };

      synthesisRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not available. Please refresh the page.');
      return;
    }
    
    if (isListening) {
      console.log('🎤 Already listening, skipping start');
      return;
    }

    try {
      // Clear previous transcript
      setTranscript('');
      
      // Check if recognition is already running
      if (recognitionRef.current.state === 'running') {
        console.log('🎤 Speech recognition already running, skipping start');
        setIsListening(true);
        return;
      }
      
      recognitionRef.current.start();
      console.log('🎤 Starting speech recognition...');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      // If it's already started, that's okay - just log it
      if ((error as Error).name === 'InvalidStateError' && (error as Error).message.includes('already started')) {
        console.log('🎤 Speech recognition already started, continuing...');
        setIsListening(true); // Update state to reflect reality
      } else {
        setError('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log('🛑 Stopping speech recognition...');
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
  };

  const submitAnswer = async () => {
    console.log('🚀 [FRONTEND] Starting submitAnswer function...');
    console.log('📊 [FRONTEND] Current answer length:', currentAnswerRef.current?.length);
    console.log('📊 [FRONTEND] Current answer content:', currentAnswerRef.current);
    console.log('📊 [FRONTEND] Current interview state:', interview);
    
    if (!currentAnswerRef.current.trim()) {
      console.log('⚠️ [FRONTEND] Cannot submit - no answer content');
      setError('Please provide an answer before proceeding to the next question.');
      return;
    }

    // Clear silence timer when submitting
    if (silenceTimerRef.current) {
      console.log('⏰ [FRONTEND] Clearing silence timer...');
      clearTimeout(silenceTimerRef.current);
    }

    console.log('📤 [FRONTEND] Submitting answer:', currentAnswerRef.current);
    console.log('📤 [FRONTEND] Transcript:', transcript);
    console.log('📤 [FRONTEND] Time spent:', timeSpent);

    try {
      const token = localStorage.getItem('token');
      console.log('🔑 [FRONTEND] Token available:', !!token);
      
      const requestBody = {
        answer: currentAnswerRef.current,
        transcript: transcript,
        timeSpent: timeSpent
      };
      
      console.log('📤 [FRONTEND] Sending answer to backend:', {
        url: `/api/interviews/${resolvedParams.id}/answer`,
        method: 'POST',
        body: requestBody
      });
      
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 [FRONTEND] Answer submission response status:', response.status);
      console.log('📥 [FRONTEND] Answer submission response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [FRONTEND] Answer submitted successfully:', data);
        console.log('📊 [FRONTEND] Updated interview status:', data.data.interview.status);
        console.log('📊 [FRONTEND] Updated interview currentQuestionIndex:', data.data.interview.currentQuestionIndex);
        console.log('📊 [FRONTEND] Answered question:', data.data.answeredQuestion);
        
        setInterview(data.data.interview);
        
        // Add answer to transcript history
        console.log('📝 [FRONTEND] Adding answer to transcript history...');
        setTranscriptHistory(prev => [...prev, {
          type: 'answer',
          content: submittedAnswer,
          timestamp: new Date()
        }]);
        
        // Store current question and answer before they get updated
        const currentQuestion = data.data.answeredQuestion;
        const submittedAnswer = currentAnswerRef.current; // Store answer before clearing
        
        if (!currentQuestion) {
          console.error('❌ [FRONTEND] No answered question found in response, cannot proceed with analysis');
          return;
        }
        
        console.log('📝 [FRONTEND] Current question for analysis:', currentQuestion.question);
        
        // Add to conversation context
        console.log('💬 [FRONTEND] Adding to conversation context...');
        console.log('💬 [FRONTEND] Previous conversation context:', conversationContext);
        setConversationContext(prev => {
          const newContext = [
            ...prev,
            `Q: ${currentQuestion.question}`,
            `A: ${submittedAnswer}`
          ];
          console.log('💬 [FRONTEND] New conversation context:', newContext);
          return newContext;
        });
        
        // Also update the interview's conversation history
        console.log('💬 [FRONTEND] Updating interview conversation history...');
        setInterview(prev => {
          if (!prev) return prev;
          const newConversationEntry: {
            type: 'question' | 'answer';
            content: string;
            timestamp: Date;
          } = {
            type: 'answer',
            content: submittedAnswer,
            timestamp: new Date()
          };
          const updatedHistory = [...(prev.conversationHistory || []), newConversationEntry];
          console.log('💬 [FRONTEND] Updated interview conversation history:', updatedHistory);
          return {
            ...prev,
            conversationHistory: updatedHistory
          };
        });
        
        // Analyze the answer and generate follow-up question
        console.log('🔄 [FRONTEND] Analyzing answer and generating follow-up for question:', currentQuestion.question);
        
        // Only proceed if interview is still in progress
        if (data.data.interview.status === 'in-progress') {
          console.log('✅ [FRONTEND] Interview still in progress, proceeding with intelligent conversational flow...');
          
          // Analyze answer first and get analysis result
          console.log('🔍 [FRONTEND] Starting answer analysis...');
          setIsAnalyzingAnswer(true);
          
          try {
            const token = localStorage.getItem('token');
            const analysisResponse = await apiCall(`/api/interviews/${resolvedParams.id}/analyze-answer`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                question: currentQuestion.question,
                answer: submittedAnswer
              }),
            });

            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              console.log('✅ [FRONTEND] Answer analysis completed:', analysisData.data.analysis);
              
              setAnswerAnalysis(analysisData.data.analysis);
              updateUserPerformance(analysisData.data.analysis);
              
              // Use conversational flow handler to decide next action
              console.log('🎯 [FRONTEND] Handling conversational flow based on analysis...');
              setTimeout(() => {
                handleConversationalFlow(
                  currentQuestion.question,
                  submittedAnswer,
                  analysisData.data.analysis
                );
              }, 500); // Reduced delay for smoother flow
            } else {
              console.error('❌ [FRONTEND] Failed to analyze answer, proceeding with next question');
              setTimeout(() => {
                getNextQuestionFromAI();
              }, 500); // Reduced delay for smoother flow
            }
          } catch (error) {
            console.error('❌ [FRONTEND] Error in analysis flow:', error);
            setTimeout(() => {
              getNextQuestionFromAI();
            }, 500); // Reduced delay for smoother flow
          } finally {
            setIsAnalyzingAnswer(false);
          }
        } else {
          console.log('⚠️ [FRONTEND] Interview completed, skipping analysis and next question generation');
          console.log('📊 [FRONTEND] Final interview status:', data.data.interview.status);
        }
        
        setCurrentAnswer('');
        currentAnswerRef.current = ''; // Clear ref
        setTranscript('');
        setTimeSpent(0);
        stopTimer();
        
        // Stop and restart speech recognition to reset its state
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
            console.log('🔄 Stopped speech recognition for reset');
          } catch (error) {
            console.log('🔄 Speech recognition already stopped');
          }
        }
        
        // If interview is completed, redirect to results
        if (data.data.interview.status === 'completed') {
          console.log('✅ Interview completed, redirecting to results');
          router.push(`/interview/${resolvedParams.id}/results`);
        } else {
          console.log('🔄 Interview still in progress, waiting for follow-up question...');
          // Clear previous answer and transcript for new question
          setCurrentAnswer('');
          currentAnswerRef.current = ''; // Clear ref
          setTranscript('');
          
          // Keep the current question displayed until the next one is ready
          // Don't clear displayedQuestion here to prevent UI disappearing
          console.log('🔄 Waiting for follow-up question to be generated and spoken...');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ [FRONTEND] Submit answer error:', errorData);
        console.error('❌ [FRONTEND] Response status:', response.status);
        setError('Failed to submit answer: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ [FRONTEND] Submit answer network error:', err);
      console.error('❌ [FRONTEND] Error details:', {
        message: (err as Error).message,
        stack: (err as Error).stack,
        name: (err as Error).name
      });
      setError('Network error: ' + (err as Error).message);
    }
  };

  const endInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/interviews/${resolvedParams.id}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push(`/interview/${resolvedParams.id}/results`);
      } else {
        setError('Failed to end interview');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Interview not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Page Heading */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{interview.title}</h1>
          <p className="text-lg text-gray-400">
              Question {interview.currentQuestionIndex + 1} of {interview.totalQuestions}
            </p>
              </div>

        {/* Personality Selection */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Choose Your Interviewer Style</h3>
          <div className="flex justify-center space-x-4">
            {[
              { key: 'friendly', label: 'Friendly', emoji: '😊', desc: 'Warm & Encouraging' },
              { key: 'technical', label: 'Technical', emoji: '🔧', desc: 'Precise & Analytical' },
              { key: 'behavioral', label: 'Behavioral', emoji: '💭', desc: 'Empathetic & Understanding' },
              { key: 'challenging', label: 'Challenging', emoji: '⚡', desc: 'Rigorous & Demanding' }
            ].map((personality) => (
              <button
                key={personality.key}
                onClick={() => updatePersonality(personality.key)}
                disabled={isUpdatingPersonality}
                className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentPersonality === personality.key
                    ? 'bg-purple-600 text-white shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                } ${isUpdatingPersonality ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">{personality.emoji}</div>
                <div className="text-sm font-medium">{personality.label}</div>
                <div className="text-xs opacity-75">{personality.desc}</div>
              </button>
            ))}
            </div>
          {isUpdatingPersonality && (
            <p className="text-sm text-purple-400 mt-2 animate-pulse">
              🎭 Updating interviewer personality...
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-900 border border-red-700 p-4">
            <div className="text-sm text-red-300">{error}</div>
          </div>
        )}

        {/* Interview Status Messages */}
        {interview.status === 'draft' && (
          <div className="text-center py-12">
            <div className="text-purple-400 text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-4">Interview Ready</h2>
            <p className="text-gray-400 mb-8">Your interview is set up and ready to begin.</p>
            <button
              onClick={() => router.push(`/interview/${resolvedParams.id}/start`)}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Interview
            </button>
          </div>
        )}

        {interview.status === 'in-progress' && interview.currentQuestion && (
          <div className="space-y-8">
            {/* Main Video Conferencing Layout - Full Width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Interviewer Panel */}
              <div className="bg-gray-800 rounded-xl p-12 text-center min-h-[300px] flex flex-col justify-center">
                <div className="mb-8">
                  <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                        <span className="text-4xl">🤖</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">AI Interviewer</h3>
                  <div className="flex items-center justify-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      isSpeaking ? 'bg-green-500 animate-pulse' : 
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-lg text-gray-300">
                      {isSpeaking ? 'Speaking' : 'Ready'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Panel */}
              <div className="bg-gray-800 rounded-xl p-12 text-center min-h-[300px] flex flex-col justify-center">
                <div className="mb-8">
                  <div className="w-48 h-48 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden">
                        {user?.profilePicture ? (
                          <img 
                            src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profilePicture}`} 
                            alt={user.fullName || 'User'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-4xl text-gray-600">${(user.fullName || 'U').charAt(0).toUpperCase()}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-4xl text-gray-600">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : '👤'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {user?.fullName || 'You'}
                  </h3>
                  <div className="flex items-center justify-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      isListening ? 'bg-red-500 animate-pulse' : 
                      isWaitingForUser ? 'bg-orange-500 animate-pulse' : 
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-lg text-gray-300">
                      {isListening ? 'Listening' : 
                       isWaitingForUser ? 'Preparing' : 
                       'Ready'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Q&A Display Area */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-sm text-gray-400">Question {interview.currentQuestionIndex + 1} of {interview.totalQuestions}</span>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-6 min-h-[12rem] flex flex-col justify-center">
                  {/* Question Section */}
                  <div className="mb-6">
                    <h3 className="text-sm text-gray-400 mb-2">Question:</h3>
                    <p className="text-lg text-white leading-relaxed">
                      {isSpeaking ? displayedQuestion : (displayedQuestion || (interview.currentQuestion?.question || ''))}
                      {isQuestionAnimating && (
                        <span className="inline-block w-1 h-6 bg-white ml-1 animate-pulse"></span>
                      )}
                      {!isSpeaking && !displayedQuestion && !interview.currentQuestion?.question && (
                        <span className="text-gray-400 italic">Loading question...</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Answer Section */}
                  <div>
                    <h3 className="text-sm text-gray-400 mb-2">Your Answer:</h3>
                    {currentAnswer ? (
                      <p className="text-lg text-white leading-relaxed">{currentAnswer}</p>
                    ) : isWaitingForUser ? (
                      <p className="text-orange-400 italic text-lg animate-pulse">⏳ Please wait, preparing to listen...</p>
                    ) : (
                      <p className="text-gray-400 italic text-lg">🎤 Speak your answer using the microphone...</p>
                    )}
                          </div>
                </div>
                
                {/* Status Indicators */}
                <div className="mt-4 space-y-2">
                  {isSpeaking && (
                    <p className="text-sm text-purple-400 font-medium">
                      🔊 AI is asking this question aloud
                    </p>
                  )}
                  
                  {isWaitingForUser && (
                    <p className="text-sm text-orange-400 font-medium animate-pulse">
                      ⏳ Preparing to listen for your answer...
                    </p>
                  )}
                  
                  {isListening && (
                    <p className="text-sm text-green-400 font-medium">
                      🎤 Listening for your answer...
                    </p>
                  )}
                  
                  {isInterrupted && (
                    <p className="text-sm text-orange-400 font-medium">
                      🛑 AI was interrupted
                    </p>
                  )}
                  
                  {isHandlingInterruption && (
                    <p className="text-sm text-red-400 font-medium animate-pulse">
                      ⚡ Processing interruption...
                    </p>
                  )}
                  
                  {isAnalyzingVoice && (
                    <p className="text-sm text-indigo-400 font-medium animate-pulse">
                      🎭 Analyzing voice emotion...
                    </p>
                  )}
                  
                  {detectedEmotion && (
                    <p className="text-sm text-indigo-400 font-medium">
                      🎭 Detected emotion: {detectedEmotion}
                    </p>
                  )}
                  
        {isGettingNextQuestion && (
          <p className="text-sm text-blue-400 font-medium animate-pulse">
            🤖 AI Interviewer is thinking of the next question...
          </p>
        )}
                  
                  {isAnalyzingAnswer && (
                    <p className="text-sm text-purple-400 font-medium animate-pulse">
                      🔍 Analyzing your answer...
                    </p>
                  )}
                          </div>

                {/* Answer Analysis */}
                {answerAnalysis && (
                  <div className="mt-4 bg-blue-900 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-blue-300">Answer Analysis</h4>
                      {answerAnalysis.personality && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-400">
                            {answerAnalysis.personality === 'friendly' && '😊'}
                            {answerAnalysis.personality === 'technical' && '🔧'}
                            {answerAnalysis.personality === 'behavioral' && '💭'}
                            {answerAnalysis.personality === 'challenging' && '⚡'}
                          </span>
                          <span className="text-xs text-blue-400 capitalize">
                            {answerAnalysis.personality} Style
                          </span>
                        </div>
                      )}
                      </div>
                    
                    {/* Scores */}
                    {answerAnalysis.scores && (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-200">{answerAnalysis.scores.completeness || 0}/10</div>
                          <div className="text-xs text-blue-400">Completeness</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-200">{answerAnalysis.scores.clarity || 0}/10</div>
                          <div className="text-xs text-blue-400">Clarity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-200">{answerAnalysis.scores.relevance || 0}/10</div>
                          <div className="text-xs text-blue-400">Relevance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-200">{answerAnalysis.scores.specificity || 0}/10</div>
                          <div className="text-xs text-blue-400">Specificity</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Overall Feedback */}
                    <div className="mb-3">
                      <p className="text-sm text-blue-200 font-medium">Overall Feedback:</p>
                      <p className="text-sm text-blue-300">{answerAnalysis.overallFeedback || 'No feedback available'}</p>
                    </div>
                    
                    {/* Strengths */}
                    {answerAnalysis.strengths && answerAnalysis.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-green-300 font-medium">Strengths:</p>
                        <ul className="text-sm text-green-200">
                          {answerAnalysis.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="text-green-400 mr-2">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Areas for Improvement */}
                    {answerAnalysis.improvements && answerAnalysis.improvements.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-orange-300 font-medium">Areas for Improvement:</p>
                        <ul className="text-sm text-orange-200">
                          {answerAnalysis.improvements.map((improvement: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="text-orange-400 mr-2">•</span>
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Missing Information */}
                    {answerAnalysis.missingInformation && answerAnalysis.missingInformation.length > 0 && (
                      <div>
                        <p className="text-sm text-yellow-300 font-medium">Missing Information:</p>
                        <ul className="text-sm text-yellow-200">
                          {answerAnalysis.missingInformation.map((missing: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="text-yellow-400 mr-2">!</span>
                              {missing}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}


                {/* Performance Tracking */}
                {userPerformance.avgScore > 0 && (
                  <div className="mt-4 bg-purple-900 border border-purple-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-300 mb-3">Your Performance</h4>
                    
                    {/* Overall Score */}
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-purple-200">{userPerformance.avgScore.toFixed(1)}/10</div>
                      <div className="text-sm text-purple-400">Average Score</div>
                    </div>
                    
                    {/* Strengths */}
                    {userPerformance.strengths.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-green-300 font-medium">Your Strengths:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userPerformance.strengths.map((strength: string, index: number) => (
                            <span key={index} className="text-xs bg-green-800 text-green-200 px-2 py-1 rounded">
                              {strength}
                            </span>
                          ))}
                        </div>
                  </div>
                )}
                    
                    {/* Areas to Improve */}
                    {userPerformance.weaknesses.length > 0 && (
                      <div>
                        <p className="text-sm text-orange-300 font-medium">Areas to Improve:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userPerformance.weaknesses.map((weakness: string, index: number) => (
                            <span key={index} className="text-xs bg-orange-800 text-orange-200 px-2 py-1 rounded">
                              {weakness}
                            </span>
                          ))}
              </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conversation Context */}
                {conversationContext.length > 0 && (
                  <div className="mt-4 bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Conversation History</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {conversationContext.map((item: string, index: number) => (
                        <div key={index} className={`text-xs p-2 rounded ${
                          item.startsWith('Q:') 
                            ? 'bg-blue-900 text-blue-200' 
                            : 'bg-green-900 text-green-200'
                        }`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Voice Emotion Analysis */}
                {voiceAnalysis && (
                  <div className="mt-4 bg-indigo-900 border border-indigo-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-indigo-300">Voice Emotion Analysis</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {voiceAnalysis.emotion === 'confident' && '😎'}
                          {voiceAnalysis.emotion === 'nervous' && '😰'}
                          {voiceAnalysis.emotion === 'anxious' && '😟'}
                          {voiceAnalysis.emotion === 'excited' && '🤩'}
                          {voiceAnalysis.emotion === 'calm' && '😌'}
                          {voiceAnalysis.emotion === 'uncertain' && '🤔'}
                          {voiceAnalysis.emotion === 'enthusiastic' && '🎉'}
                          {voiceAnalysis.emotion === 'hesitant' && '😅'}
                        </span>
                        <span className="text-xs text-indigo-400 capitalize">
                          {voiceAnalysis.emotion}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-200">{voiceAnalysis.confidence}/10</div>
                        <div className="text-xs text-indigo-400">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-200">{voiceAnalysis.enthusiasm}/10</div>
                        <div className="text-xs text-indigo-400">Enthusiasm</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-200">{voiceAnalysis.clarity}/10</div>
                        <div className="text-xs text-indigo-400">Clarity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-200">{voiceAnalysis.nervousness}/10</div>
                        <div className="text-xs text-indigo-400">Nervousness</div>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-indigo-200 font-medium">Analysis:</p>
                      <p className="text-sm text-indigo-300">{voiceAnalysis.analysis}</p>
                    </div>
                    
                    {voiceAnalysis.recommendations && voiceAnalysis.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm text-indigo-200 font-medium">Recommendations:</p>
                        <ul className="text-sm text-indigo-300">
                          {voiceAnalysis.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-center">
                              <span className="text-indigo-400 mr-2">💡</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

              {/* Live Transcript */}
              {transcript && (
                  <div className="mt-4 bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-300">
                    <span className="font-medium">Live transcript:</span> {transcript}
                  </p>
                </div>
              )}
              </div>
              </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                <button
                  onClick={() => speakText(interview.currentQuestion?.question || displayedQuestion || 'No question available')}
                  disabled={isSpeaking || !interview.currentQuestion?.question}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                <span>{isSpeaking ? '🔊' : '🔊'}</span>
                <span>{isSpeaking ? 'Speaking...' : 'Replay Question'}</span>
                </button>
                
                <button
                  onClick={isListening ? stopListening : startListening}
                disabled={!recognitionRef.current}
                className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                    isListening 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                <span>{isListening ? '🛑' : '🎤'}</span>
                <span>{isListening ? 'Stop Recording' : 'Record Answer'}</span>
                </button>
                
              <button
                onClick={endInterview}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                End Interview
              </button>
              
              <button
                onClick={handleInterruption}
                disabled={!isSpeaking || isHandlingInterruption}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <span>🛑</span>
                <span>{isHandlingInterruption ? 'Interrupting...' : 'Interrupt AI'}</span>
              </button>
              
                <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                Leave Meeting
                </button>
            </div>
          </div>
        )}

        {interview.status === 'completed' && (
          <div className="text-center py-12">
            <div className="text-green-400 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-4">Interview Completed!</h2>
            <p className="text-gray-400 mb-8">Great job! Your interview has been completed.</p>
            <button
              onClick={() => router.push(`/interview/${resolvedParams.id}/results`)}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              View Results
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
