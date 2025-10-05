'use client';

import { useState, useEffect, useRef, use } from 'react';
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
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAnswerRef = useRef<string>(''); // Add ref to track current answer

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Initialize speech APIs
    initializeSpeechAPIs();
    fetchInterview();
    
    return () => {
      cleanup();
    };
  }, [resolvedParams.id, router]);

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
      const response = await fetch(`http://localhost:5000/api/interviews/${resolvedParams.id}`, {
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
        
        // If interview is in progress and has a current question, speak it automatically
        if (data.data.interview.status === 'in-progress' && data.data.interview.currentQuestion) {
          console.log('🎯 Auto-speaking first question:', data.data.interview.currentQuestion.question);
          // Small delay to ensure UI is ready
          setTimeout(() => {
            speakText(data.data.interview.currentQuestion.question);
            startTimer();
            // Note: Speech recognition will start automatically when AI finishes speaking
            // This is handled in the speakText function's onend callback
          }, 500);
        } else {
          console.log('⚠️ Not auto-speaking question. Status:', data.data.interview.status, 'Current question:', data.data.interview.currentQuestion);
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
      }
    }, 5000); // 5 seconds of silence
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    startSilenceTimer();
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
        
        // Start speech recognition AFTER AI finishes speaking
        setTimeout(() => {
          console.log('🎤 Question ended, starting speech recognition...');
          setIsWaitingForUser(true); // Show waiting state
          
          if (recognitionRef.current && !isListening) {
            try {
              recognitionRef.current.start();
              console.log('🎤 Started speech recognition after question ended');
              setIsWaitingForUser(false); // Hide waiting state when recognition starts
            } catch (error) {
              console.log('🎤 Speech recognition start failed:', error);
              setIsWaitingForUser(false); // Hide waiting state on error
            }
          }
          
          // Start silence timer for auto-submit
          setTimeout(() => {
            console.log('🎤 Starting silence timer for auto-submit...');
            startSilenceTimer();
          }, 1000); // Wait 1 second after speech recognition starts
        }, 2000); // Wait 2 seconds after question ends to ensure AI voice is completely finished
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
    if (!currentAnswerRef.current.trim()) return;

    // Clear silence timer when submitting
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    console.log('📤 Submitting answer:', currentAnswerRef.current);
    console.log('📤 Transcript:', transcript);
    console.log('📤 Time spent:', timeSpent);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/interviews/${resolvedParams.id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: currentAnswerRef.current,
          transcript: transcript,
          timeSpent: timeSpent
        }),
      });

      console.log('📤 Response status:', response.status);
      console.log('📤 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('📤 Response data:', data);
        setInterview(data.data.interview);
        
        // Add answer to transcript history
        setTranscriptHistory(prev => [...prev, {
          type: 'answer',
          content: currentAnswerRef.current,
          timestamp: new Date()
        }]);
        
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
        } else if (data.data.interview.currentQuestion) {
          console.log('🔄 Next question available:', data.data.interview.currentQuestion.question);
          // Clear previous answer and transcript for new question
          setCurrentAnswer('');
          currentAnswerRef.current = ''; // Clear ref
          setTranscript('');
          setDisplayedQuestion(''); // Clear displayed question
          // Auto-speak the next question
          setTimeout(() => {
            speakText(data.data.interview.currentQuestion.question);
            startTimer();
            // Note: Speech recognition will start automatically when AI finishes speaking
            // This is handled in the speakText function's onend callback
          }, 1000); // Wait 1 second before speaking next question
        } else {
          console.log('⚠️ No next question available');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Submit answer error:', errorData);
        setError('Failed to submit answer: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Submit answer network error:', err);
      setError('Network error: ' + (err as Error).message);
    }
  };

  const endInterview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/interviews/${resolvedParams.id}/end`, {
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
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                        <span className="text-4xl">👤</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">You</h3>
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
                      {isSpeaking ? displayedQuestion : (displayedQuestion || interview.currentQuestion.question)}
                      {isQuestionAnimating && (
                        <span className="inline-block w-1 h-6 bg-white ml-1 animate-pulse"></span>
                      )}
                      {!isSpeaking && !displayedQuestion && !interview.currentQuestion.question && (
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
                </div>

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
                onClick={() => speakText(interview.currentQuestion!.question)}
                disabled={isSpeaking}
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