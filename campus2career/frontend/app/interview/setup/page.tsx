'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';

interface FormData {
  role: string;
  customRole: string;
  skills: string[];
  interviewType: string;
  interviewLevel: string;
  questionCount: number;
  customQuestionCount: number;
  yearsOfExperience: number;
}

export default function InterviewSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    role: 'frontend-developer',
    customRole: '',
    skills: [],
    interviewType: 'technical',
    interviewLevel: 'intermediate',
    questionCount: 10,
    customQuestionCount: 10,
    yearsOfExperience: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSkillAdd();
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRoleDisplayName = () => {
    if (formData.role === 'others') {
      return formData.customRole || 'Custom Role';
    }
    return formData.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const finalRole = formData.role === 'others' ? formData.customRole : formData.role;
      const finalQuestionCount = formData.questionCount === 0 ? formData.customQuestionCount : formData.questionCount;
      
      const response = await fetch('process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'/api/interviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${getRoleDisplayName()} ${formData.interviewType} Interview`,
          role: finalRole,
          interviewType: formData.interviewType,
          difficulty: formData.interviewLevel,
          totalQuestions: finalQuestionCount,
          skills: formData.skills,
          yearsOfExperience: formData.yearsOfExperience
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to interview start page
        router.push(`/interview/${data.data.interview.id}/start`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create interview');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎤</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Setup Your Interview</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Let's customize your AI interview experience step by step
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Step {currentStep} of 4
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round((currentStep / 4) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Role Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What role are you preparing for?
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: 'frontend-developer', label: 'Frontend Developer' },
                        { value: 'backend-developer', label: 'Backend Developer' },
                        { value: 'full-stack-developer', label: 'Full Stack Developer' },
                        { value: 'data-scientist', label: 'Data Scientist' },
                        { value: 'devops-engineer', label: 'DevOps Engineer' },
                        { value: 'ai-ml-engineer', label: 'AI/ML Engineer' }
                      ].map((role) => (
                        <label key={role.value} className="relative">
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={formData.role === role.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.role === role.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}>
                            <div className="text-center">
                              <div className="text-lg font-medium text-gray-900 dark:text-white">
                                {role.label}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <label className="relative">
                      <input
                        type="radio"
                        name="role"
                        value="others"
                        checked={formData.role === 'others'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.role === 'others'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}>
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Others
                          </div>
                          {formData.role === 'others' && (
                            <input
                              type="text"
                              name="customRole"
                              value={formData.customRole}
                              onChange={handleChange}
                              placeholder="Enter your custom role"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    What skills or technologies should we focus on?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Add the key skills, technologies, or frameworks you want the interview questions to cover.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={handleSkillKeyPress}
                        placeholder="e.g., React, Python, AWS, Docker..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSkillAdd}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {formData.skills.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Selected Skills:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                            >
                              {skill}
                              <button
                                type="button"
                                onClick={() => handleSkillRemove(skill)}
                                className="ml-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Interview Level & Type */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Choose your interview level and type
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Interview Level
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'beginner', label: 'Beginner', description: '0-2 years experience' },
                          { value: 'intermediate', label: 'Intermediate', description: '2-5 years experience' },
                          { value: 'advanced', label: 'Advanced', description: '5+ years experience' }
                        ].map((level) => (
                          <label key={level.value} className="flex items-center">
                            <input
                              type="radio"
                              name="interviewLevel"
                              value={level.value}
                              checked={formData.interviewLevel === level.value}
                              onChange={handleChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {level.label}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {level.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Interview Type
                      </label>
                      <select
                        name="interviewType"
                        value={formData.interviewType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="mixed">Mixed (Technical + Behavioral)</option>
                        <option value="case-study">Case Study</option>
                        <option value="system-design">System Design</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      min="0"
                      max="50"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Question Count & Summary */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    How many questions would you like?
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      {[5, 10, 15].map((count) => (
                        <label key={count} className="relative">
                          <input
                            type="radio"
                            name="questionCount"
                            value={count}
                            checked={formData.questionCount === count}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                            formData.questionCount === count
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{count}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">questions</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    
                    <label className="relative">
                      <input
                        type="radio"
                        name="questionCount"
                        value={0}
                        checked={formData.questionCount === 0}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.questionCount === 0
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}>
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Custom
                          </div>
                          {formData.questionCount === 0 && (
                            <input
                              type="number"
                              name="customQuestionCount"
                              min="1"
                              max="50"
                              value={formData.customQuestionCount}
                              onChange={handleChange}
                              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-center"
                            />
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Interview Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Role:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{getRoleDisplayName()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Skills:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.skills.length > 0 ? formData.skills.join(', ') : 'General'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Level:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {formData.interviewLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Type:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {formData.interviewType.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Experience:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.yearsOfExperience} years
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Questions:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formData.questionCount === 0 ? formData.customQuestionCount : formData.questionCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating Interview...' : 'Start Interview'}
                </button>
              )}
            </div>
            
            {/* Cancel Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Cancel and return to dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}