import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import ContestManagement from "./ContestManagement";
import ContestList from "./ContestList";
import SubmissionModeration from "./SubmissionModeration";
import ContestAnalytics from "./ContestAnalytics";
import { EmailMarketing } from "./EmailMarketing";
import { MainHeader } from "../header";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("contests");
  const [showCreateForm, setShowCreateForm] = useState(false);

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
                onSuccess={() => {
                  setShowCreateForm(false);
                }}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <ContestList
              onEdit={() => {
                // Implement edit functionality
                setShowCreateForm(true);
              }}
            />
          )}
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
