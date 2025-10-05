import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/general.action";

interface PageProps {
  params: {
    id: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const user = await getCurrentUser();
  const interview = await getInterviewById(params.id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Questions</h1>
        {interview && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">Role:</span> {interview.role}
              </div>
              <div>
                <span className="font-semibold">Level:</span> {interview.level}
              </div>
              <div>
                <span className="font-semibold">Type:</span> {interview.type}
              </div>
            </div>
            {interview.techstack && interview.techstack.length > 0 && (
              <div className="mt-2">
                <span className="font-semibold">Tech Stack:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {interview.techstack.map((tech, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {interview && interview.questions && interview.questions.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Generated Questions</h2>
          <div className="space-y-4">
            {interview.questions.map((question, index) => (
              <div
                key={index}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-gray-800">{question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found for this interview.</p>
        </div>
      )}

      <div className="border-t pt-8">
        <h3 className="text-xl font-semibold mb-4">Voice Interview</h3>
        <Agent
          userName={user?.name!}
          userId={user?.id}
          interviewId={params.id}
          type="interview"
          questions={interview?.questions}
        />
      </div>
    </div>
  );
};

export default Page;