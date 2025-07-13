import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, Image, FileText, Users, Trophy } from "lucide-react";

interface Contest {
  _id: string;
  id?: string;
  title: string;
  description: string;
  image_url?: string; // For compatibility
  lineArt?: string; // Primary API field name
  startDate: string;
  endDate: string;
  contest_type?: "traditional" | "digital"; // Frontend field name
  contestType?: "traditional" | "digital"; // Backend field name
  status: "draft" | "scheduled" | "active" | "completed";
  createdAt?: string; // MongoDB timestamp field (primary)
  updatedAt?: string; // MongoDB timestamp field
  created_at?: string; // Alternative field name for compatibility
}

interface ContestViewProps {
  contest: Contest | null;
  onClose: () => void;
}

export default function ContestView({ contest, onClose }: ContestViewProps) {
  if (!contest) return null;

  // Debug: Log the contest data to see what fields are available
  console.log("ContestView received contest data:", contest);

  const getStatusBadge = (status: Contest["status"]) => {
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
  };

  return (
    <Dialog open={!!contest} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Contest Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Contest Image */}
            <div className="lg:w-1/2">
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                {contest.lineArt || contest.image_url ? (
                  <>
                    {/* Debug info */}
                    {console.log("Image source:", contest.lineArt || contest.image_url)}
                    <img
                      src={contest.lineArt || contest.image_url}
                      alt={contest.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", e.currentTarget.src);
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No image available</p>
                      <p className="text-xs text-muted-foreground">lineArt: {contest.lineArt || 'undefined'}</p>
                      <p className="text-xs text-muted-foreground">image_url: {contest.image_url || 'undefined'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contest Info */}
            <div className="lg:w-1/2 space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(contest.status)}
                  <Badge variant="outline">
                    {(contest.contestType || contest.contest_type) === "traditional" ? "Traditional" : "Digital"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Start Date:</span>
                  <span>
                    {contest.startDate && !isNaN(new Date(contest.startDate).getTime())
                      ? format(new Date(contest.startDate), "PPP")
                      : "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">End Date:</span>
                  <span>
                    {contest.endDate && !isNaN(new Date(contest.endDate).getTime())
                      ? format(new Date(contest.endDate), "PPP")
                      : "Not set"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>
                    {contest.createdAt || contest.created_at
                      ? format(new Date(contest.createdAt || contest.created_at || ""), "PPP")
                      : "Creation date not available"}
                  </span>
                  {/* Debug info */}
                  <span className="text-xs text-muted-foreground ml-2">
                    (createdAt: {contest.createdAt || 'undefined'}, created_at: {contest.created_at || 'undefined'})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Description</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                {contest.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* Contest Type Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Contest Type</h2>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                {(contest.contestType || contest.contest_type) === "traditional"
                  ? "This is a traditional contest where participants color the provided line art image."
                  : "This is a digital contest where participants create original artwork based on the given theme."}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Contest ID</h3>
              <p className="text-sm text-muted-foreground font-mono">{contest._id}</p>
            </div>

            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Status</h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(contest.status)}
                <span className="text-sm text-muted-foreground capitalize">
                  {contest.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
