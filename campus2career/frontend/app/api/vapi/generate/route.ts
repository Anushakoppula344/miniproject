import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";

export async function GET(){
    return Response.json({ success: true, data: "THANK YOU!" }, { status: 200 });
}

export async function POST(request: Request){
    const { type, role, level, techstack, amount, userid } = await request.json();

    try {
        const { text } = await generateText({
            model: google('gemini-2.0-flash-001'),
            prompt: `Generate a list of ${amount} interview questions for the role of ${role} at level ${level}. Include tech stack as follows: ${techstack.join(', ')}. Provide only the questions as a JSON array. Thank you.`
        });

        // Parse the generated questions from the AI response
        // Handle markdown-formatted JSON response from Gemini
        let jsonText = text.trim();

        // Remove markdown code block formatting if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\s*/, '').replace(/```\s*$/, '');
        }

        // Try to extract JSON array if it's embedded in other text
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }

        // Clean up any remaining quotes or formatting issues
        jsonText = jsonText.replace(/`/g, '');

        const parsedData = JSON.parse(jsonText);

        // Handle different response formats from Gemini AI
        let questions: string[] = [];
        if (Array.isArray(parsedData)) {
            questions = parsedData.map((item: any) => {
                // If item is an object with 'question' property, extract it
                if (typeof item === 'object' && item.question) {
                    return item.question;
                }
                // If item is already a string, use it directly
                return item;
            }).filter(q => q && q.trim().length > 0);
        } else {
            throw new Error('Invalid response format from AI');
        }

        const interview = {
            role,
            type,
            level,
            techstack: techstack,
            questions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString()
        };

        // Save to backend API instead of direct Firebase
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://miniproject-delta-beryl.vercel.app'}/api/interviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interview)
        });

        if (!response.ok) {
            throw new Error('Failed to save interview to backend');
        }

        const result = await response.json();

        return Response.json({
            success: true,
            interviewId: result.interviewId,
            questions: questions
        }, { status: 200 });
    }
    catch(error){
        console.error('Error generating questions:', error);

        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate questions'
        }, { status: 500 });
    }
}
