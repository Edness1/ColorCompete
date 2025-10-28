import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useToast } from "../ui/use-toast";
import { CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import { API_URL } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Invalid link",
        description: "The password reset link is missing a token.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: "Password too short",
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to reset password" }));
        throw new Error(data.message || "Failed to reset password");
      }

      setIsSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully. You can now sign in.",
      });
    } catch (error: any) {
      toast({
        title: "Unable to reset password",
        description: error.message || "Please try the link again or request a new reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {isSuccess ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Password Reset
                </>
              ) : (
                <>
                  <Lock className="h-6 w-6 text-primary" />
                  Reset Your Password
                </>
              )}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isSuccess
                ? "Your password has been updated. You can sign in with your new password."
                : "Create a new password to regain access to your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="space-y-4">
                <Button className="w-full" onClick={handleGoToSignIn}>
                  Return to Sign In
                </Button>
                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center justify-center w-full">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Home
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a new password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Reset Password"}
                </Button>
                <div className="text-center">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Forgot Password
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
