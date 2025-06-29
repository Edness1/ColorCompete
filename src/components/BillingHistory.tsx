import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Download,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface BillingRecord {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed" | "refunded";
  description: string;
  invoice_url?: string;
  payment_method: string;
  subscription_tier: string;
}

const BillingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);

  // Mock data for demonstration
  const mockBillingHistory: BillingRecord[] = [
    {
      id: "inv_001",
      date: "2024-01-15",
      amount: 19.99,
      status: "paid",
      description: "Premium Plan - January 2024",
      invoice_url: "#",
      payment_method: "•••• 4242",
      subscription_tier: "premium",
    },
    {
      id: "inv_002",
      date: "2023-12-15",
      amount: 19.99,
      status: "paid",
      description: "Premium Plan - December 2023",
      invoice_url: "#",
      payment_method: "•••• 4242",
      subscription_tier: "premium",
    },
    {
      id: "inv_003",
      date: "2023-11-15",
      amount: 9.99,
      status: "paid",
      description: "Pro Plan - November 2023",
      invoice_url: "#",
      payment_method: "•••• 4242",
      subscription_tier: "pro",
    },
    {
      id: "inv_004",
      date: "2023-10-15",
      amount: 9.99,
      status: "paid",
      description: "Pro Plan - October 2023",
      invoice_url: "#",
      payment_method: "•••• 4242",
      subscription_tier: "pro",
    },
    {
      id: "inv_005",
      date: "2023-09-15",
      amount: 9.99,
      status: "failed",
      description: "Pro Plan - September 2023",
      payment_method: "•••• 4242",
      subscription_tier: "pro",
    },
  ];

  useEffect(() => {
    const fetchBillingHistory = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from("billing_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.log("No billing history table found, using mock data");
          setBillingHistory(mockBillingHistory);
        } else if (data && data.length > 0) {
          setBillingHistory(
            data.map((record: any) => ({
              id: record.id,
              date: record.created_at,
              amount: record.amount / 100, // Convert from cents
              status: record.status,
              description: record.description,
              invoice_url: record.invoice_url,
              payment_method: record.payment_method,
              subscription_tier: record.subscription_tier,
            })),
          );
        } else {
          setBillingHistory(mockBillingHistory);
        }
      } catch (error) {
        console.error("Error fetching billing history:", error);
        setBillingHistory(mockBillingHistory);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingHistory();
  }, [user]);

  useEffect(() => {
    const total = billingHistory
      .filter((record) => record.status === "paid")
      .reduce((sum, record) => sum + record.amount, 0);
    setTotalSpent(total);
  }, [billingHistory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge variant="default" className="bg-green-500">
            Paid
          </Badge>
        );
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = (invoiceUrl: string) => {
    if (invoiceUrl && invoiceUrl !== "#") {
      window.open(invoiceUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4 bg-background">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Billing History</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                Loading billing history...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Billing History</h1>
          <p className="text-muted-foreground">
            View and manage your payment history
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-2">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{billingHistory.length}</div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {billingHistory.filter((r) => r.status === "paid").length}
              </div>
              <p className="text-sm text-muted-foreground">Paid Invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">
                {billingHistory.length > 0
                  ? format(new Date(billingHistory[0].date), "MMM yyyy")
                  : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">Latest Payment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            Complete history of your payments and invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Billing History</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made any payments yet.
              </p>
              <Link to="/pricing">
                <Button>View Pricing Plans</Button>
              </Link>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(record.date), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.description}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {record.subscription_tier} Plan
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${record.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {record.payment_method}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.invoice_url && record.status === "paid" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadInvoice(record.invoice_url!)
                              }
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                          {record.status === "failed" && (
                            <Button variant="outline" size="sm">
                              Retry Payment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            If you have questions about your billing or need assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Payment Issues</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Having trouble with a payment or need to update your payment
                method?
              </p>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Update Payment Method
                </Button>
              </Link>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Contact Support</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Need help with billing questions or refund requests?
              </p>
              <Link to="/contact">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingHistory;
