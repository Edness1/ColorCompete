import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "./ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { verifyPaymentSession, refreshSubscriptionData } = useSubscription();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = localStorage.getItem("sessionId");

      if (!sessionId) {
        setError("No payment session ID found");
        setIsVerifying(false);
        return;
      }

      try {
        const { success, error } = await verifyPaymentSession(sessionId);

        if (success) {
          setVerificationSuccess(true);
          // Refresh subscription data to get updated submission count
          await refreshSubscriptionData();
          localStorage.removeItem("sessionId"); // Clear session ID after verification
          toast({
            title: "Payment Successful",
            description: "Your payment was processed successfully.",
            variant: "success",
          });
        } else {
          setError(error || "Payment verification failed");
          toast({
            title: "Payment Verification Failed",
            description: error || "Unable to verify your payment.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [toast, user]);

  const handleContinue = () => {
    // Navigate back to the home page or contest page
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg">Verifying your payment...</p>
            </div>
          ) : verificationSuccess ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">
                  Payment Successful!
                </h3>
                <p className="text-muted-foreground">
                  Thank you for your payment. Your submission credits have been
                  added to your account.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Payment Error</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={isVerifying}
            className="w-full"
          >
            {verificationSuccess ? "Continue" : "Return to Home"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
