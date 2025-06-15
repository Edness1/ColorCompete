import React from "react";
import { useNavigate } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleReturn = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-amber-100 p-3">
              <XCircle className="h-12 w-12 text-amber-600" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Payment Cancelled</h3>
              <p className="text-muted-foreground">
                Your payment process was cancelled. No charges were made to your
                account.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturn} className="w-full">
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentCancel;
