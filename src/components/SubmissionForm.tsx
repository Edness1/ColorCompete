import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Users,
  CreditCard,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "@/lib/utils";

interface SubmissionFormProps {
  onSubmit?: (args: {
    imageUrl: string;
    ageGroup: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  }) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  contestId?: string;
  contestType?: "traditional" | "digital";
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  onSubmit = () => {},
  isOpen = true,
  onClose = () => {},
  contestId,
  contestType: initialContestType,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    remainingSubmissions,
    tier,
    deductSubmission,
    getSubmissionFee,
    createCheckoutSession,
    verifyPaymentSession,
    isLoading: isLoadingSubscription,
  } = useSubscription();

  const [imageUrl, setImageUrl] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  // Check for payment success from URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get("session_id");

    if (sessionId) {
      // Verify the payment session
      const verifySession = async () => {
        setIsSubmitting(true);
        const { success, error } = await verifyPaymentSession(sessionId);

        if (success) {
          // Clear the URL parameter
          navigate(location.pathname, { replace: true });
          // Show confirmation dialog
          setShowPaymentPrompt(false);
          setShowConfirmation(true);
          toast({
            title: "Payment Successful",
            description:
              "Your payment was processed successfully. You can now submit your artwork.",
          });
        } else {
          setError(`Payment verification failed: ${error}`);
        }
        setIsSubmitting(false);
      };

      verifySession();
    }
  }, [location.search]);
  const [ageGroup, setAgeGroup] = useState<string>("adult");
  const [contestType, setContestType] = useState<string>(
    initialContestType || "traditional",
  );

  useEffect(() => {
    if (imageUrl) {
      setPreview(imageUrl);
    } else {
      setPreview(null);
    }
  }, [imageUrl]);

  const handleSubmit = () => {
    if (!imageUrl) {
      setError("Please enter an image URL");
      return;
    }
    if (!user) {
      setError("Please sign in to submit artwork");
      return;
    }
    const submissionFee = getSubmissionFee();
    if (submissionFee !== null) {
      setShowPaymentPrompt(true);
    } else {
      setShowConfirmation(true);
    }
  };

  const confirmSubmission = async () => {
    if (!imageUrl || !user) return;
    setIsSubmitting(true);
    try {
      const submissionPayload = {
        user_id: user._id,
        file_path: imageUrl,
        public_url: imageUrl,
        age_group: ageGroup,
        contest_type: contestType,
        status: "submitted",
        votes: [],
        created_at: new Date().toISOString(),
        challenge_id: contestId,
        profiles: {
          username: user.username,
          avatar_url: user.avatar_url,
        },
      };

      const res = await fetch(API_URL + "/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to submit artwork");
      }

      if (onSubmit) {
        await onSubmit({
          imageUrl,
          ageGroup,
        });
      }

      toast({
        title: "Submission Successful",
        description: "Your artwork has been submitted for the contest!",
      });

      setIsSubmitting(false);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      setIsSubmitting(false);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit artwork. Please try again.",
      );
      toast({
        title: "Submission Failed",
        description:
          "There was a problem submitting your artwork. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setImageUrl("");
    setPreview(null);
    setError(null);
    setShowConfirmation(false);
    setShowPaymentPrompt(false);
    setAgeGroup("adult");
    setContestType("traditional");
  };

  const handlePaymentSuccess = async () => {
    setIsSubmitting(true);
    try {
      // Create a Stripe checkout session
      const { sessionUrl, error } = await createCheckoutSession(
        contestId || "",
      );

      if (error || !sessionUrl) {
        throw new Error(error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Payment error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to process payment. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Submit Your Colored Artwork
          </DialogTitle>
          {user && !isLoadingSubscription && (
            <div className="flex justify-center mt-2">
              <div className="bg-muted/50 px-4 py-2 rounded-full flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan:{" "}
                  {remainingSubmissions} submission
                  {remainingSubmissions !== 1 ? "s" : ""} remaining
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-2 border-dashed border-muted-foreground/25 bg-background">
            <CardContent className="p-4">
              <Label htmlFor="image-url" className="text-sm font-medium mb-2 block">
                Image URL
              </Label>
              <input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/your-artwork.jpg"
                className="w-full border rounded px-3 py-2 text-base"
              />
              {preview && (
                <div className="mt-4 relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-[300px] object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={() => {
                      setImageUrl("");
                      setPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <div>
              <Label
                htmlFor="age-group"
                className="text-sm font-medium mb-2 block"
              >
                Age Group Category
              </Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger id="age-group" className="w-full">
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="child">Child (under 13)</SelectItem>
                  <SelectItem value="teen">Teen (13-17)</SelectItem>
                  <SelectItem value="adult">Adult (18+)</SelectItem>
                  <SelectItem value="senior">Senior (65+)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Submissions are grouped by age category for fair competition
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Contest Format
              </Label>
              <RadioGroup
                value={contestType}
                onValueChange={setContestType}
                className="flex flex-col space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="traditional" id="traditional" />
                  <Label htmlFor="traditional" className="cursor-pointer">
                    Traditional (Color the provided line art)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="digital" id="digital" />
                  <Label htmlFor="digital" className="cursor-pointer">
                    Digital (Create original digital artwork based on theme)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="sm:w-auto w-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!imageUrl || isSubmitting}
            className="sm:w-auto w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Artwork"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>
              Are you sure you want to submit this artwork for the daily
              contest?
            </p>
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium">Submission Details:</p>
              <ul className="text-sm mt-1 space-y-1">
                <li>
                  <span className="text-muted-foreground">Age Group:</span>{" "}
                  {ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)}
                </li>
                <li>
                  <span className="text-muted-foreground">Contest Format:</span>{" "}
                  {contestType.charAt(0).toUpperCase() + contestType.slice(1)}
                </li>
                <li>
                  <span className="text-muted-foreground">Submission:</span>{" "}
                  {remainingSubmissions > 0 ? (
                    <span className="text-green-600 font-medium">
                      Using 1 submission credit
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium">
                      $2.99 (A portion will be donated to charity)
                    </span>
                  )}
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmSubmission} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Submitting
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirm
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentPrompt} onOpenChange={setShowPaymentPrompt}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Submission Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center text-amber-600 mb-2">
              <CreditCard className="h-12 w-12" />
            </div>
            <p className="text-center">
              You've used all your {tier} plan submissions for this month.
            </p>
            <div className="bg-muted/50 p-4 rounded-md">
              <p className="text-center font-medium mb-2">Options:</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                  <div>
                    <p className="font-medium">Pay-per-submission</p>
                    <p className="text-sm text-muted-foreground">
                      One-time fee for this submission
                    </p>
                  </div>
                  <p className="font-bold">$2.99</p>
                </div>
                <div className="flex justify-between items-center p-2 border rounded-md hover:bg-accent/50 cursor-pointer">
                  <div>
                    <p className="font-medium">Upgrade your plan</p>
                    <p className="text-sm text-muted-foreground">
                      Get more monthly submissions
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onClose()}>
                    View Plans
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentPrompt(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSuccess}>
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pay $2.99
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default SubmissionForm;
