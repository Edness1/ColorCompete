import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Submission {
  id: string;
  user_id: string;
  file_path: string;
  public_url: string;
  age_group: string;
  contest_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  votes: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

export default function SubmissionModeration() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions(activeTab);
  }, [activeTab]);

  async function fetchSubmissions(status: string) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*, profiles(username, avatar_url)")
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function updateSubmissionStatus(id: string, status: string) {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Submission updated",
        description: `The submission has been ${status === "approved" ? "approved" : "rejected"}.`,
      });

      // Refresh the list
      fetchSubmissions(activeTab);
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error updating submission:", error);
      toast({
        title: "Error",
        description: "Failed to update submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Moderation</CardTitle>
        <CardDescription>Review and moderate user submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No {activeTab} submissions found
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={submission.public_url}
                        alt={`Submission by ${submission.profiles?.username || "Anonymous"}`}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">
                          {submission.profiles?.username || "Anonymous"}
                        </h3>
                        <Badge>
                          {submission.contest_type === "traditional"
                            ? "Traditional"
                            : "Digital"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(submission.created_at),
                            "MMM d, yyyy",
                          )}
                        </p>
                        <Badge variant="outline">{submission.age_group}</Badge>
                      </div>

                      {activeTab === "pending" && (
                        <div className="flex justify-between mt-4 gap-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              updateSubmissionStatus(submission.id, "rejected")
                            }
                            disabled={isProcessing}
                          >
                            <XCircle className="h-4 w-4 mr-2 text-destructive" />
                            Reject
                          </Button>
                          <Button
                            className="w-full"
                            onClick={() =>
                              updateSubmissionStatus(submission.id, "approved")
                            }
                            disabled={isProcessing}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submission Detail Dialog */}
        <Dialog
          open={!!selectedSubmission}
          onOpenChange={() => setSelectedSubmission(null)}
        >
          <DialogContent className="sm:max-w-[800px]">
            {selectedSubmission && (
              <>
                <DialogHeader>
                  <DialogTitle>Submission Details</DialogTitle>
                  <DialogDescription>
                    Submitted by{" "}
                    {selectedSubmission.profiles?.username || "Anonymous"} on{" "}
                    {format(
                      new Date(selectedSubmission.created_at),
                      "MMMM d, yyyy 'at' h:mm a",
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                  <div>
                    <div className="aspect-square overflow-hidden rounded-md">
                      <img
                        src={selectedSubmission.public_url}
                        alt={`Submission by ${selectedSubmission.profiles?.username || "Anonymous"}`}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Submission Information</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-sm text-muted-foreground">
                          Status:
                        </div>
                        <div>
                          <Badge
                            variant={
                              selectedSubmission.status === "approved"
                                ? "default"
                                : selectedSubmission.status === "rejected"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {selectedSubmission.status.charAt(0).toUpperCase() +
                              selectedSubmission.status.slice(1)}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Age Group:
                        </div>
                        <div className="capitalize">
                          {selectedSubmission.age_group}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Contest Type:
                        </div>
                        <div className="capitalize">
                          {selectedSubmission.contest_type}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          File Name:
                        </div>
                        <div className="truncate">
                          {selectedSubmission.file_name}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          File Size:
                        </div>
                        <div>
                          {formatFileSize(selectedSubmission.file_size)}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          File Type:
                        </div>
                        <div>{selectedSubmission.file_type}</div>

                        <div className="text-sm text-muted-foreground">
                          Votes:
                        </div>
                        <div>{selectedSubmission.votes}</div>
                      </div>
                    </div>

                    {selectedSubmission.status === "pending" && (
                      <div className="flex gap-4 pt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            updateSubmissionStatus(
                              selectedSubmission.id,
                              "rejected",
                            )
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2 text-destructive" />
                          )}
                          Reject Submission
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() =>
                            updateSubmissionStatus(
                              selectedSubmission.id,
                              "approved",
                            )
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve Submission
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
