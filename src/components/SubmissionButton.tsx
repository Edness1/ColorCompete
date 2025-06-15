import { useState } from "react";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import SubmissionForm from "./SubmissionForm";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./auth/AuthModal";

interface SubmissionButtonProps {
  contestId?: string;
  contestType?: "traditional" | "digital";
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function SubmissionButton({
  contestId,
  contestType = "traditional",
  className = "",
  variant = "default",
  size = "lg",
}: SubmissionButtonProps) {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  const handleSubmitClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowSubmissionForm(true);
  };

  return (
    <>
      <Button
        onClick={handleSubmitClick}
        variant={variant}
        size={size}
        className={`gap-2 ${className}`}
      >
        <Upload className="h-5 w-5" />
        Submit Your Artwork
      </Button>

      {showSubmissionForm && (
        <SubmissionForm
          isOpen={showSubmissionForm}
          onClose={() => setShowSubmissionForm(false)}
          contestId={contestId}
          contestType={contestType}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signin"
      />
    </>
  );
}
