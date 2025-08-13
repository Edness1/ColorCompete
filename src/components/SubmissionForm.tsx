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

const CLOUDINARY_UPLOAD_PRESET = "cewqtwou"; // <-- set this
const CLOUDINARY_CLOUD_NAME = "dwnqwem6e"; // <-- set this

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
    tier: rawTier,
    deductSubmission,
    getSubmissionFee,
    createCheckoutSession,
    verifyPaymentSession,
    refreshSubscriptionData,
    isLoading: isLoadingSubscription,
  } = useSubscription();
  const tier = rawTier || "free"; // Ensure tier is never null

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
    console.log("handleSubmit called");
    console.log("imageUrl:", imageUrl);
    console.log("user:", user);
    console.log("remainingSubmissions:", remainingSubmissions);
    
    if (!imageUrl) {
      setError("Please enter an image URL");
      return;
    }
    if (!user) {
      setError("Please sign in to submit artwork");
      return;
    }
    if (remainingSubmissions <= 0) {
      console.log("No submissions remaining, showing payment prompt");
      setShowPaymentPrompt(true);
      return;
    }
    console.log("All checks passed, showing confirmation");
    setShowConfirmation(true);
  };

  const confirmSubmission = async () => {
    if (!imageUrl || !user) return;
    setIsSubmitting(true);
    try {
      console.log("Starting submission process...");
      console.log("Current remaining submissions:", remainingSubmissions);
      console.log("User ID:", user._id);
      
      // Deduct a submission credit BEFORE submitting if user has credits
      let shouldProceed = true;
      if (remainingSubmissions > 0) {
        console.log("Attempting to deduct submission...");
        shouldProceed = await deductSubmission();
        console.log("Deduction result:", shouldProceed);
        if (!shouldProceed) {
          throw new Error("Failed to process submission credit. Please try again.");
        }
      } else {
        console.log("No remaining submissions, should redirect to payment");
        setShowPaymentPrompt(true);
        setIsSubmitting(false);
        return;
      }

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
          username: user.username || "Anonymous",
          avatar_url: "", // Will be set by the API based on user profile
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

      // Refresh subscription data to ensure UI is in sync
      await refreshSubscriptionData();

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

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      // Enhance the image using Cloudinary's e_enhance transformation
      // Insert '/e_enhance/' after '/upload/' in the URL
      let enhancedUrl = data.secure_url;
      enhancedUrl = enhancedUrl.replace('/upload/', '/upload/e_enhance/');
      setImageUrl(enhancedUrl);
      setPreview(enhancedUrl);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent style={{ maxHeight: "90vh", overflowY: "auto" }} className="sm:max-w-[800px] bg-background">
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshSubscriptionData()}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  Refresh
                </Button>
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

          <div className="space-y-6">
            {/* Image Upload Tips */}
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📸 Tips for the Best Quality Upload (Phone Users Welcome!)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                To make your coloring artwork shine for the judges, follow these
                quick steps before uploading:
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">1. Use Natural Lighting</p>
                  <p className="text-muted-foreground ml-4">
                    <strong>Best:</strong> Indirect sunlight from a nearby
                    window.
                    <br />
                    <strong>Avoid:</strong> Harsh overhead lights or flash.
                    <br />
                    <strong>Pro Tip:</strong> Morning or late afternoon gives
                    the most even light.
                  </p>
                </div>
                <div>
                  <p className="font-medium">
                    2. Shoot From Above, Keep It Flat
                  </p>
                  <p className="text-muted-foreground ml-4">
                    Lay your artwork on a flat surface.
                    <br />
                    Hold your phone directly above it—no angles!
                    <br />
                    Use both hands or a tripod for stability.
                  </p>
                </div>
                <div>
                  <p className="font-medium">3. Avoid Shadows</p>
                  <p className="text-muted-foreground ml-4">
                    Watch out for your own shadow on the paper.
                    <br />
                    Try positioning the light source behind or to the side of
                    your phone, not behind you.
                  </p>
                </div>
                <div>
                  <p className="font-medium">4. Clean Your Lens</p>
                  <p className="text-muted-foreground ml-4">
                    A quick lens wipe makes a huge difference—no smudges or
                    blur.
                  </p>
                </div>
                <div>
                  <p className="font-medium">
                    5. Zoom with Your Feet, Not the Camera
                  </p>
                  <p className="text-muted-foreground ml-4">
                    Don't pinch to zoom; instead, move your phone closer to fill
                    the frame.
                    <br />
                    Stay just far enough that the whole artwork fits without
                    distortion.
                  </p>
                </div>
                <div>
                  <p className="font-medium">6. No Filters, Please!</p>
                  <p className="text-muted-foreground ml-4">
                    Keep it true to life—judges want to see the real colors you
                    used.
                  </p>
                </div>
                <div>
                  <p className="font-medium">7. Crop Tight, Not Sloppy</p>
                  <p className="text-muted-foreground ml-4">
                    Crop just outside the edges of the artwork. No clutter or
                    background items.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-2 border-dashed border-muted-foreground/25 bg-background">
            <CardContent className="p-4">
              <Label htmlFor="image-url" className="text-sm font-medium mb-2 block">
                Image URL
              </Label>
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="file"
                  accept="image/*"
                  id="file-upload"
                  style={{ display: "none" }}
                  disabled={isSubmitting}
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isSubmitting}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isSubmitting ? "Uploading..." : "Upload from device"}
                </Button>
              </div>
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Out of Submissions</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-center text-amber-600 mb-2">
              <CreditCard className="h-12 w-12" />
            </div>
            <p className="text-center font-medium">
              You've run out of submissions, upgrade for more
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentPrompt(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowPaymentPrompt(false);
                onClose();
                navigate('/pricing');
              }}
            >
              Upgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default SubmissionForm;
