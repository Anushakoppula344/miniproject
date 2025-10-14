"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { feedbackSchema } from "@/constants";

// ✅ Create Feedback
export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    if (!interviewId || !userId) {
        console.error("createFeedback called without interviewId or userId");
        return { success: false, message: "Missing interviewId or userId" };
    }

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001"),

            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
      `,
            system:
                "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = {
            interviewId,
            userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: new Date().toISOString(),
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...feedback, feedbackId }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false };
    }
}

// ✅ Get Interview by ID
export async function getInterviewById(id: string): Promise<Interview | null> {
    if (!id) return null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/interviews/${id}`);
    if (!response.ok) return null;
    return await response.json();
}

// ✅ Get Feedback by Interview ID
export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    if (!interviewId || !userId) return null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/feedback?interviewId=${interviewId}&userId=${userId}`);
    if (!response.ok) return null;
    const feedbacks = await response.json();
    return feedbacks.length > 0 ? feedbacks[0] : null;
}

// ✅ Get Latest Interviews (excluding current user)
export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    if (!userId) {
        return []; // no user → no results
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/interviews/latest?userId=${userId}&limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
}

// ✅ Get Interviews by User ID
export async function getInterviewsByUserId(
    userId?: string
): Promise<Interview[] | null> {
    if (!userId) {
        return []; // no user → no results
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/interviews?userId=${userId}`);
    if (!response.ok) return [];
    return await response.json();
}
