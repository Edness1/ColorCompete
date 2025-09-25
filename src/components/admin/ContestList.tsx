import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, Trash2, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import axios from "axios"; // Add this import
import { API_URL } from "@/lib/utils";

interface Contest {
  _id: string;
  id?: string; // Keep for backward compatibility
  title: string;
  description: string;
  image_url?: string; // For compatibility
  lineArt?: string;   // Primary API field name
  startDate: string; // updated
  endDate: string;   // updated
  contest_type?: "traditional" | "digital"; // Frontend field name
  contestType?: "traditional" | "digital"; // Backend field name
  status: "draft" | "scheduled" | "active" | "completed";
  createdAt?: string; // MongoDB timestamp field (primary)
  updatedAt?: string; // MongoDB timestamp field
  created_at?: string; // Alternative field name for compatibility
}

interface ContestListProps {
  onEdit?: (contest: Contest) => void;
  onView?: (contest: Contest) => void;
}

export default function ContestList({ onEdit, onView }: ContestListProps) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchContests();
  }, []);

  async function fetchContests() {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL+"/api/challenges");
      setContests(response.data || []);
    } catch (error) {
      console.error("Error fetching contests:", error);
      toast({
        title: "Error",
        description: "Failed to load contests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(API_URL + `/api/challenges/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete contest");
      }

      toast({
        title: "Contest deleted",
        description: "The contest has been successfully deleted.",
      });

      // Refresh the list
      fetchContests();
    } catch (error) {
      console.error("Error deleting contest:", error);
      toast({
        title: "Error",
        description: "Failed to delete contest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  }

  function getStatusBadge(status: Contest["status"]) {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "completed":
        return <Badge variant="destructive">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }



  return (
    <Card>
      <CardHeader>
        <CardTitle>Contest Management</CardTitle>
        <CardDescription>Manage your daily coloring contests</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No contests found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first contest to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => (
                  <TableRow key={contest._id}>
                    <TableCell className="font-medium">
                      {contest.title}
                    </TableCell>
                    <TableCell>
                      {(contest.contestType || contest.contest_type) === "traditional"
                        ? "Traditional"
                        : "Digital"}
                    </TableCell>
                    <TableCell>
                      {contest.startDate && !isNaN(new Date(contest.startDate).getTime())
                        ? format(new Date(contest.startDate), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {contest.endDate && !isNaN(new Date(contest.endDate).getTime())
                        ? format(new Date(contest.endDate), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{getStatusBadge(contest.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView && onView(contest)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit && onEdit(contest)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contest._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                contest and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}