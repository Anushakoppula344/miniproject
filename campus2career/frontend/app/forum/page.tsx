'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../components/NotificationProvider';

interface Question {
  id: string;
  _id?: string;
  title: string;
  content: string;
  author: string;
  authorName?: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  createdAt: string;
  replies: number;
  answerCount?: number;
  likes: number;
  likeCount?: number;
  isLiked: boolean;
  isBookmarked: boolean;
  views: number;
  viewCount?: number;
}

interface Reply {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isAccepted: boolean;
}

export default function ForumPage() {
  const { addNotification } = useNotifications();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newQuestion, setNewQuestion] = useState({ title: '', content: '', category: '', tags: '' });
  const [showNewQuestion, setShowNewQuestion] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const [newReply, setNewReply] = useState({ content: '' });
  const [showReplies, setShowReplies] = useState<string | null>(null);
  const [questionReplies, setQuestionReplies] = useState<{ [questionId: string]: Reply[] }>({});

  
  const categories = ['Technical', 'Behavioral', 'Company Culture', 'Career Advice', 'Interview Tips', 'General'];

  const mockQuestions: Question[] = [
    {
      id: '1',
      title: 'How to prepare for Google technical interviews?',
      content: 'I have a technical interview at Google next week for a Software Engineer position. What are the best resources and strategies to prepare effectively?',
      author: 'Anusha Koppula',
      authorAvatar: 'A',
      category: 'Technical',
      tags: ['Google', 'Technical Interview', 'Preparation'],
      createdAt: '2024-01-15T10:30:00Z',
      replies: 12,
      likes: 24,
      isLiked: false,
      isBookmarked: true,
      views: 156
    },
    {
      id: '2',
      title: 'Company culture at Microsoft vs Amazon',
      content: 'I have offers from both Microsoft and Amazon. Can anyone share insights about the work culture, work-life balance, and growth opportunities at both companies?',
      author: 'Rajesh Kumar',
      authorAvatar: 'R',
      category: 'Company Culture',
      tags: ['Microsoft', 'Amazon', 'Culture', 'Work-Life Balance'],
      createdAt: '2024-01-14T15:45:00Z',
      replies: 8,
      likes: 18,
      isLiked: true,
      isBookmarked: false,
      views: 89
    },
    {
      id: '3',
      title: 'Best practices for behavioral interviews',
      content: 'What are some effective strategies for answering behavioral questions using the STAR method? Any specific examples that work well?',
      author: 'Priya Sharma',
      authorAvatar: 'P',
      category: 'Behavioral',
      tags: ['Behavioral Interview', 'STAR Method', 'Preparation'],
      createdAt: '2024-01-13T09:20:00Z',
      replies: 15,
      likes: 31,
      isLiked: false,
      isBookmarked: true,
      views: 203
    },
    {
      id: '4',
      title: 'Data Science interview preparation roadmap',
      content: 'I am transitioning from software development to data science. What should be my learning roadmap for data science interviews?',
      author: 'Suresh Patel',
      authorAvatar: 'S',
      category: 'Career Advice',
      tags: ['Data Science', 'Career Transition', 'Learning Path'],
      createdAt: '2024-01-12T14:10:00Z',
      replies: 6,
      likes: 14,
      isLiked: false,
      isBookmarked: false,
      views: 67
    },
    {
      id: '5',
      title: 'How to handle coding challenges under pressure?',
      content: 'I always get nervous during coding interviews and make silly mistakes. Any tips to stay calm and perform better under pressure?',
      author: 'Meera Singh',
      authorAvatar: 'M',
      category: 'Interview Tips',
      tags: ['Coding Interview', 'Pressure', 'Nervousness'],
      createdAt: '2024-01-11T11:30:00Z',
      replies: 9,
      likes: 22,
      isLiked: true,
      isBookmarked: false,
      views: 98
    }
  ];

  const mockReplies: Reply[] = [
    {
      id: '1',
      content: 'For Google technical interviews, I recommend focusing on algorithms and data structures from LeetCode. Practice system design questions and be ready to explain your thought process clearly.',
      author: 'Alex Chen',
      authorAvatar: 'A',
      createdAt: '2024-01-15T11:00:00Z',
      likes: 8,
      isLiked: false,
      isAccepted: true
    },
    {
      id: '2',
      content: 'Don\'t forget to practice coding on a whiteboard or paper since Google often conducts interviews this way. Also, review Google\'s engineering practices and culture.',
      author: 'Sarah Johnson',
      authorAvatar: 'S',
      createdAt: '2024-01-15T12:15:00Z',
      likes: 5,
      isLiked: true,
      isAccepted: false
    }
  ];

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await apiCall('/api/questions', {
        headers: { 
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        console.log('Number of questions from API:', data.data.questions.length); // Debug log
        const apiQuestions = data.data.questions.map((q: any) => ({
          id: q._id,
          _id: q._id,
          title: q.title,
          content: q.content,
          author: q.authorName || 'Unknown',
          authorName: q.authorName,
          authorAvatar: (q.authorName || 'U').charAt(0),
          category: q.category,
          tags: q.tags || [],
          createdAt: q.createdAt,
          replies: q.answerCount || 0,
          answerCount: q.answerCount,
          likes: q.likeCount || 0,
          likeCount: q.likeCount,
          isLiked: q.isLiked || false,
          isBookmarked: q.isBookmarked || false,
          views: q.views || 0,
          viewCount: q.views
        }));
        console.log('Mapped Questions:', apiQuestions); // Debug log
        console.log('Question IDs:', apiQuestions.map((q: any) => q.id)); // Debug log
        setQuestions(apiQuestions);
      } else {
        console.error('API Error:', response.status, response.statusText);
        // Fallback to mock data
        setQuestions(mockQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback to mock data
      setQuestions(mockQuestions);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === '' || question.category === selectedCategory)
  );

  const handleLike = async (questionId: string) => {
    try {
      const response = await apiCall(`/api/questions/${questionId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Temporarily disabled for testing
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, likes: data.data.likeCount, likeCount: data.data.likeCount, isLiked: data.data.isLiked }
            : q
        ));
        
        // Question liked/unliked - use toast instead
        toast.success(data.data.isLiked ? 'Question liked!' : 'Question unliked!');
      } else {
        console.error('Error liking question:', response.status, response.statusText);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update like status'
        });
      }
    } catch (error) {
      console.error('Error liking question:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update like status'
      });
    }
  };

  const handleBookmark = async (questionId: string) => {
    try {
      const response = await fetch(apiCall(`/api/questions/${questionId}/bookmark`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Temporarily disabled for testing
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, isBookmarked: data.data.isBookmarked, bookmarkCount: data.data.bookmarkCount }
            : q
        ));
        
        // Question bookmarked/unbookmarked - use toast instead
        toast.success(data.data.isBookmarked ? 'Question bookmarked!' : 'Question unbookmarked!');
      } else {
        console.error('Error bookmarking question:', response.status, response.statusText);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update bookmark status'
        });
      }
    } catch (error) {
      console.error('Error bookmarking question:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update bookmark status'
      });
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(apiCall('/api/questions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newQuestion.title,
          content: newQuestion.content,
          category: newQuestion.category,
          tags: newQuestion.tags
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Question created:', data); // Debug log
        const newQ = {
          id: data.data.question._id,
          title: data.data.question.title,
          content: data.data.question.content,
          author: data.data.question.authorName || 'Unknown',
          authorName: data.data.question.authorName,
          authorAvatar: (data.data.question.authorName || 'U').charAt(0),
          category: data.data.question.category,
          tags: data.data.question.tags || [],
          createdAt: data.data.question.createdAt,
          replies: 0,
          answerCount: 0,
          likes: 0,
          likeCount: 0,
          isLiked: false,
          isBookmarked: false,
          views: 0,
          viewCount: 0
        };
        setQuestions([newQ, ...questions]);
        setNewQuestion({ title: '', content: '', category: '', tags: '' });
        setShowNewQuestion(false);
        // Question posted successfully - use toast instead
        toast.success('Question Posted', {
          description: 'Your question has been posted successfully and is now visible to other users'
        });
      } else {
        console.error('API Error:', response.status, response.statusText);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to post question. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating question:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to post question. Please try again.'
      });
    }
  };

  const handleReply = async (questionId: string) => {
    if (!newReply.content.trim()) return;
    
    try {
      const response = await fetch(apiCall(`/api/questions/${questionId}/answers`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newReply.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reply created:', data); // Debug log
        
        // Update the question's reply count
        setQuestions(questions.map(q => 
          q.id === questionId 
            ? { ...q, replies: q.replies + 1, answerCount: data.data.answerCount }
            : q
        ));
        
        // Refresh replies if they are currently shown
        if (showReplies === questionId) {
          await fetchReplies(questionId);
        }
        
        setNewReply({ content: '' });
        setShowReplyForm(null);
        // Reply posted successfully - use toast instead
        toast.success('Reply Posted', {
          description: 'Your reply has been posted successfully'
        });
      } else {
        console.error('API Error:', response.status, response.statusText);
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to post reply. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to post reply. Please try again.'
      });
    }
  };

  const handleShowReplyForm = (questionId: string) => {
    setShowReplyForm(questionId);
    setNewReply({ content: '' });
  };

  const handleCancelReply = () => {
    setShowReplyForm(null);
    setNewReply({ content: '' });
  };

  const fetchReplies = async (questionId: string) => {
    try {
      const response = await fetch(apiCall(`/api/questions/${questionId}/answers`), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const replies = data.data.answers.map((reply: any) => ({
          id: reply._id,
          content: reply.content,
          author: reply.authorName || 'Unknown',
          authorAvatar: (reply.authorName || 'U').charAt(0),
          createdAt: reply.createdAt,
          likes: reply.likeCount || 0,
          isLiked: false,
          isAccepted: reply.isAccepted || false
        }));
        
        setQuestionReplies(prev => ({
          ...prev,
          [questionId]: replies
        }));
      } else {
        console.error('Error fetching replies:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleToggleReplies = async (questionId: string) => {
    if (showReplies === questionId) {
      // Hide replies
      setShowReplies(null);
    } else {
      // Show replies
      setShowReplies(questionId);
      // Fetch replies if not already loaded
      if (!questionReplies[questionId]) {
        await fetchReplies(questionId);
      }
    }
  };

  const handleViewQuestion = async (questionId: string) => {
    try {
      console.log('Viewing question:', questionId); // Debug log
      console.log('Current questions:', questions.map(q => ({ id: q.id, title: q.title, views: q.views }))); // Debug log
      // Increment view count by fetching the question details
      const response = await fetch(apiCall(`/api/questions/${questionId}`), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('View count response:', data.data.question.views); // Debug log
        // Update the question with the new view count
        setQuestions(questions.map(q => {
          console.log('Checking question ID:', q.id, 'against:', questionId, 'match:', q.id === questionId); // Debug log
          if (q.id === questionId) {
            console.log('Updating view count for question:', q.title, 'from', q.views, 'to', data.data.question.views); // Debug log
            return { ...q, views: data.data.question.views, viewCount: data.data.question.views };
          }
          return q;
        }));
      } else {
        console.error('Error fetching question details:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error updating view count:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Q&A Forum
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Ask questions, share insights, and connect with other students
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewQuestion(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors whitespace-nowrap"
                >
                  Ask Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <div key={question.id}>
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                          {question.authorAvatar}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 
                            className="text-lg font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            onClick={() => handleViewQuestion(question.id)}
                          >
                            {question.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleBookmark(question.id)}
                              className={`p-1 rounded ${question.isBookmarked ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                          {question.content}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                            <span>{question.author}</span>
                            <span>{formatTimeAgo(question.createdAt)}</span>
                            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">
                              {question.category}
                            </span>
                          </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          <span>{question.views || question.viewCount || 0} views</span>
                          <button
                            onClick={() => handleToggleReplies(question.id)}
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          >
                            {question.replies || question.answerCount || 0} replies
                          </button>
                        </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleLike(question.id)}
                              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                                question.isLiked 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span>{question.likes || question.likeCount || 0}</span>
                            </button>
                            <button 
                              onClick={() => handleShowReplyForm(question.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reply Form */}
                  {showReplyForm === question.id && (
                    <div className="mt-4 ml-14 bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Write a Reply</h4>
                      <textarea
                        value={newReply.content}
                        onChange={(e) => setNewReply({ content: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Share your thoughts or provide an answer..."
                      />
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          onClick={handleCancelReply}
                          className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(question.id)}
                          disabled={!newReply.content.trim()}
                          className="px-4 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies Display */}
                  {showReplies === question.id && (
                    <div className="mt-4 ml-14">
                      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                          Replies ({questionReplies[question.id]?.length || 0})
                        </h4>
                        {questionReplies[question.id] && questionReplies[question.id].length > 0 ? (
                          <div className="space-y-3">
                            {questionReplies[question.id].map((reply) => (
                              <div key={reply.id} className="bg-white dark:bg-slate-800 rounded-md p-3 border border-slate-200 dark:border-slate-600">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 dark:text-green-400 font-semibold text-xs">
                                      {reply.authorAvatar}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {reply.author}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {formatTimeAgo(reply.createdAt)}
                                      </span>
                                      {reply.isAccepted && (
                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-medium">
                                          ✓ Accepted
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                      {reply.content}
                                    </p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <button className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span>{reply.likes}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No replies yet. Be the first to reply!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* New Question Modal */}
        {showNewQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Ask a Question</h2>
              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Question Title
                  </label>
                  <input
                    type="text"
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({...newQuestion, title: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's your question?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Question Details
                  </label>
                  <textarea
                    value={newQuestion.content}
                    onChange={(e) => setNewQuestion({...newQuestion, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide more details about your question..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., interview, preparation, technical"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewQuestion(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Post Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

