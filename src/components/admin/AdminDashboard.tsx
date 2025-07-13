import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ContestManagement from "./ContestManagement";
import ContestList from "./ContestList";
import SubmissionModeration from "./SubmissionModeration";
import ContestAnalytics from "./ContestAnalytics";
import { EmailMarketing } from "./EmailMarketing";
import ContestView from "./ContestView";
import { MainHeader } from "../header";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("contests");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingContest, setEditingContest] = useState<ContestManagementContest | null>(null);
  const [viewingContest, setViewingContest] = useState<ContestListContest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Type definition for ContestList
  interface ContestListContest {
    _id: string;
    id: string;
    title: string;
    description: string;
    image_url?: string;
    lineArt?: string;
    startDate: string;
    endDate: string;
    contest_type?: "traditional" | "digital"; // Frontend field name
    contestType?: "traditional" | "digital"; // Backend field name
    status: "draft" | "scheduled" | "active" | "completed";
    createdAt?: string; // MongoDB timestamp field (primary)
    updatedAt?: string; // MongoDB timestamp field
    created_at?: string; // Alternative field name for compatibility
  }

  // Type definition for ContestManagement (should match the one in ContestManagement)
  interface ContestManagementContest {
    _id: string;
    title: string;
    description: string;
    lineArt: string;
    startTime: string;
    endTime: string;
    contestType: "traditional" | "digital";
    status: "draft" | "scheduled" | "active" | "completed";
  }

  const handleViewContest = (contest: ContestListContest) => {
    setViewingContest(contest);
  };

  const handleEditContest = (contest: ContestListContest) => {
    // Convert ContestList contest to ContestManagement format
    const managementContest: ContestManagementContest = {
      _id: contest._id || contest.id || "",
      title: contest.title,
      description: contest.description,
      lineArt: contest.lineArt || contest.image_url || "",
      startTime: (contest as any).startTime || "09:00", // Default values since ContestList might not have these
      endTime: (contest as any).endTime || "17:00",
      contestType: contest.contestType || contest.contest_type || "traditional",
      status: contest.status,
    };
    setEditingContest(managementContest);
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    setEditingContest(null);
    setRefreshKey(prev => prev + 1); // Trigger ContestList refresh
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingContest(null);
  };

  return (
    <div className="container mx-auto py-8 bg-background">
      <MainHeader />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Admin Dashboard</h1>

        {activeTab === "contests" && !showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Contest
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="contests">Contest Management</TabsTrigger>
          <TabsTrigger value="submissions">Submission Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="contests">
          {showCreateForm ? (
            <div className="mb-8">
              <ContestManagement
                editingContest={editingContest}
                onSuccess={handleFormSuccess}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancelForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <ContestList
              key={refreshKey}
              onEdit={handleEditContest}
              onView={handleViewContest}
            />
          )}

          {/* Contest View Dialog */}
          <ContestView
            contest={viewingContest}
            onClose={() => setViewingContest(null)}
          />
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionModeration />
        </TabsContent>

        <TabsContent value="analytics">
          <ContestAnalytics />
        </TabsContent>

        <TabsContent value="email">
          <EmailMarketing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
