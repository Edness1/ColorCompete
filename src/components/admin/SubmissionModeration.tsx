// Clean implementation for listing & deleting submissions (admin view)
// Requirements: list all submissions, view details, delete with confirmation.

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { API_URL } from "@/lib/utils";

interface Submission {
  id: string; // normalized id
  _id?: string; // if backend uses _id we accommodate
  user_id?: string;
  file_path: string;
  public_url?: string;
  age_group?: string;
  contest_type?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  status?: string;
  votes?: number | string[]; // can be numeric count or array of voter IDs
  created_at: string;
  profiles?: {
    username?: string;
    avatar_url?: string;
  };
}

export default function SubmissionModeration() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  async function loadSubmissions() {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions`);
      if (!res.ok) throw new Error("Failed to fetch submissions");
      const data = await res.json();
      const normalized: Submission[] = (data || []).map((s: any) => ({
        id: s.id || s._id, // normalize id
        ...s,
      }));
      setSubmissions(normalized);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "Could not load submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function formatSize(bytes?: number) {
    if (bytes == null) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  async function handleDelete(sub: Submission) {
    const id = sub.id || sub._id!;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/submissions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSubmissions((prev) => prev.filter((s) => (s.id || s._id) !== id));
      toast({ title: "Deleted", description: "Submission removed" });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Deletion failed", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadSubmissions();
    setRefreshing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>View & delete user submissions</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing || isLoading}>
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No submissions found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {submissions.map((s) => (
              <Card key={s.id} className="overflow-hidden group">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  {/* Use public_url or file_path */}
                  <img
                    src={s.public_url || s.file_path}
                    alt={s.file_name || `Submission ${s.id}`}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button variant="secondary" size="icon" onClick={() => setSelected(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteTarget(s)}
                      disabled={deletingId === (s.id || s._id)}
                    >
                      {deletingId === (s.id || s._id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium truncate max-w-[60%]">
                      {s.profiles?.username || "Anonymous"}
                    </span>
                    {s.contest_type && <Badge className="capitalize">{s.contest_type}</Badge>}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{format(new Date(s.created_at), "MMM d, yyyy")}</span>
                    {s.age_group && <Badge variant="outline" className="capitalize">{s.age_group}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="sm:max-w-[800px]">
            {selected && (
              <>
                <DialogHeader>
                  <DialogTitle>Submission Details</DialogTitle>
                  <DialogDescription>
                    Submitted {selected.profiles?.username && (<>by <span className="font-medium">{selected.profiles.username}</span> </>)}on {format(new Date(selected.created_at), "MMMM d, yyyy 'at' h:mm a")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <div className="aspect-square overflow-hidden rounded-md bg-muted flex items-center justify-center">
                      <img
                        src={selected.public_url || selected.file_path}
                        alt={selected.file_name || `Submission ${selected.id}`}
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Info</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                        <div className="text-muted-foreground">ID</div>
                        <div className="truncate" title={selected.id}>{selected.id}</div>
                        {selected.status && (
                          <>
                            <div className="text-muted-foreground">Status</div>
                            <div>
                              <Badge
                                variant={
                                  selected.status === "approved"
                                    ? "default"
                                    : selected.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="capitalize"
                              >
                                {selected.status}
                              </Badge>
                            </div>
                          </>
                        )}
                        {selected.age_group && (
                          <>
                            <div className="text-muted-foreground">Age Group</div>
                            <div className="capitalize">{selected.age_group}</div>
                          </>
                        )}
                        {selected.contest_type && (
                          <>
                            <div className="text-muted-foreground">Contest Type</div>
                            <div className="capitalize">{selected.contest_type}</div>
                          </>
                        )}
                        {selected.file_name && (
                          <>
                            <div className="text-muted-foreground">File Name</div>
                            <div className="truncate" title={selected.file_name}>{selected.file_name}</div>
                          </>
                        )}
                        {selected.file_size != null && (
                          <>
                            <div className="text-muted-foreground">File Size</div>
                            <div>{formatSize(selected.file_size)}</div>
                          </>
                        )}
                        {selected.file_type && (
                          <>
                            <div className="text-muted-foreground">File Type</div>
                            <div>{selected.file_type}</div>
                          </>
                        )}
                        {selected.votes != null && (
                          <>
                            <div className="text-muted-foreground">Votes</div>
                            <div>{Array.isArray(selected.votes) ? selected.votes.length : selected.votes}</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setDeleteTarget(selected)}
                        disabled={deletingId === (selected.id || selected._id)}
                      >
                        {deletingId === (selected.id || selected._id) ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Submission
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Submission</DialogTitle>
              <DialogDescription>
                This action cannot be undone. Permanently remove the submission
                {deleteTarget?.profiles?.username && (
                  <> by <span className="font-medium">{deleteTarget.profiles.username}</span></>
                )}? 
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 pt-2">
              <Button variant="outline" className="w-full" onClick={() => setDeleteTarget(null)} disabled={!!deletingId}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => deleteTarget && handleDelete(deleteTarget)}
                disabled={!!deletingId}
              >
                {deletingId === (deleteTarget?.id || deleteTarget?._id) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
