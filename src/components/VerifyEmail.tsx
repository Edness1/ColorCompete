import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Mail, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${API_URL}/api/users/verify-email/${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          toast({
            title: "Email Verified!",
            description: "You can now sign in to your account.",
          });
          // Redirect to home page with sign in modal after 3 seconds
          setTimeout(() => {
            navigate('/?signin=true');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [token, navigate, toast]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleSignIn = () => {
    navigate('/?signin=true');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'verifying' && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to sign in automatically, or click below.
              </p>
              <div className="flex flex-col space-y-2">
                <Button onClick={handleSignIn} className="w-full">
                  Sign In Now
                </Button>
                <Button variant="outline" onClick={handleGoHome} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The verification link may be expired or invalid. Try requesting a new one.
              </p>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" onClick={handleGoHome} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
                <Link to="/resend-verification">
                  <Button variant="ghost" className="w-full">
                    Request New Verification Email
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'verifying' && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleGoHome}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;