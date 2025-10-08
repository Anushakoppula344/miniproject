'use client';

import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  value?: string | number;
  className?: string;
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  label,
  value,
  className = ''
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Text content on the left */}
      <div className="flex flex-col items-start min-w-0">
        {value && (
          <span className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {value}
          </span>
        )}
        {label && (
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight">
            {label}
          </span>
        )}
      </div>
      
      {/* Progress Circle on the right */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="opacity-30"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        {/* Center content - show percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-slate-900 dark:text-white ${
            size <= 80 ? 'text-sm' : size <= 100 ? 'text-base' : 'text-lg'
          }`}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </div>
  );
}