import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-3xl mx-auto">
        {/* Back button at the top */}
        <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="fixed top-16 left-6 flex items-center"
            >

            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Button>

      <h1 className="text-2xl font-bold mb-4">Help Center</h1>
      <p>
        Welcome to the SkillMap Help Center! Here you can find answers to common
        questions about using the platform.
      </p>

      <ul className="list-disc pl-6 mt-4 space-y-2">
        <li>How to register as a specialist or company</li>
        <li>How to update your profile</li>
        <li>How to find and manage job matches</li>
      </ul>

      <br></br>
      <p> <b><em> Click Here:</em></b></p>

      <div className="mt-6">
        <a
          href="/SkillMap_User_Guide.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-medium hover:text-blue-800"
        >
          Open User Guide & Documentation
        </a>
      </div>
    </div>
  );
};

export default Help;
