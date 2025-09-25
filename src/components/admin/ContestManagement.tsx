import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/utils";
import axios from "axios";

const formSchema = z
  .object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    lineArt: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    // times are enforced automatically to 11:00 UTC / +24h — not user-entered
    status: z.enum(["draft", "scheduled", "active", "completed"]),
  })
  .superRefine((data, ctx) => {
    // Force start at 11:00 UTC and end 24 hours later
    const start = new Date(`${data.startDate}T11:00:00Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    if (isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid start date",
        path: ["startDate"],
      });
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End must be after start",
        path: ["startDate"],
      });
    }

    if (data.status === "scheduled" && !isNaN(start.getTime())) {
      const now = new Date();
      if (start <= now) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled start must be in the future",
          path: ["startDate"],
        });
      }
    }
  });

interface ContestManagementProps {
  onSuccess?: () => void;
  editingContest?: Contest | null;
}

interface Contest {
  _id: string;
  title: string;
  lineArt: string;
  startDate?: string; // ISO datetime (UTC)
  endDate?: string; // ISO datetime (UTC)
  status: "draft" | "scheduled" | "active" | "completed";
}

const CLOUDINARY_UPLOAD_PRESET = "cewqtwou";
const CLOUDINARY_CLOUD_NAME = "dwnqwem6e";

export default function ContestManagement({
  onSuccess,
  editingContest,
}: ContestManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lineArtPreview, setLineArtPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);

  // parse ISO datetime (UTC) into date for inputs
  const parseIsoToDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  const initialStart = parseIsoToDate(editingContest?.startDate);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingContest?.title || "",
      lineArt: editingContest?.lineArt || "",
      startDate: initialStart || (editingContest?.startDate ? String(editingContest.startDate).slice(0, 10) : today),
      status: editingContest?.status || "draft",
    },
  });

  useEffect(() => {
    if (editingContest) {
      const parsedStart = parseIsoToDate(editingContest.startDate);

      form.reset({
        title: editingContest.title,
        lineArt: editingContest.lineArt,
        startDate: parsedStart || editingContest.startDate || today,
        status: editingContest.status,
      });
      setLineArtPreview(editingContest.lineArt);
    } else {
      form.reset({
        title: "",
        lineArt: "",
        startDate: today,
        status: "draft",
      });
      setLineArtPreview(null);
    }
  }, [editingContest, form]);

  const handleLineArtUpload = async (e: React.ChangeEvent<HTMLInputElement>, onChange: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      onChange(data.secure_url);
      setLineArtPreview(data.secure_url);
    } catch (err) {
      console.error("Line art upload error:", err);
      toast({
        title: "Upload error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
    }
    setUploading(false);
  };

  // watch startDate to show computed start/end info in the UI
  const watchedStartDate = form.watch("startDate");
  const computeStartEnd = (dateStr?: string) => {
    if (!dateStr) return { startISO: "", endISO: "", startDisplay: "", endDisplay: "" };
    const start = new Date(`${dateStr}T11:00:00Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const isoStart = start.toISOString();
    const isoEnd = end.toISOString();
    const startDisplay = `${dateStr} 11:00 UTC`;
    const endDisplay = `${end.toISOString().slice(0, 10)} 11:00 UTC`;
    return { startISO: isoStart, endISO: isoEnd, startDisplay, endDisplay };
  };
  const { startISO: computedStartISO, endISO: computedEndISO, startDisplay, endDisplay } = computeStartEnd(watchedStartDate);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Force start at 11:00 UTC and end 24 hours later
      const startDateTime = new Date(`${values.startDate}T11:00:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + 24 * 60 * 60 * 1000);

      // Prepare the data object
      const contestData: any = {
        title: values.title,
        // include time strings for compatibility if the server expects them
        startTime: "11:00",
        endTime: "11:00",
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        contestType: (editingContest as any)?.contestType || "traditional",
        status: values.status,
        ...(values.lineArt && { lineArt: values.lineArt }),
      };

      console.log("Submitting contest:", contestData);

      if (editingContest) {
        await axios.put(API_URL + `/api/challenges/${editingContest._id}`, contestData);

        toast({
          title: "Contest updated",
          description: `${values.title} has been successfully updated.`,
        });
      } else {
        if (!values.lineArt) {
          toast({
            title: "Error",
            description: "Line art image is required for new contests.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        await axios.post(API_URL + "/api/challenges", contestData);

        toast({
          title: "Contest created",
          description: `${values.title} has been successfully created.`,
        });

        form.reset();
        setLineArtPreview(null);
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error saving contest:", error);
      const serverMsg = error?.response?.data || error?.message;
      toast({
        title: "Error",
        description: `Failed to ${editingContest ? "update" : "create"} contest. ${serverMsg ? String(serverMsg) : ""}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background p-6 rounded-lg border">
      <h2 className="text-2xl font-bold mb-6">
        {editingContest ? "Edit Contest" : "Create New Contest"}
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contest Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contest title" {...field} />
                </FormControl>
                <FormDescription>Give your contest a catchy, descriptive title</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lineArt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Line Art Image</FormLabel>
                <FormControl>
                  <>
                    <Input placeholder="Enter image URL (optional)" {...field} value={field.value || ""} />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="lineart-upload"
                        style={{ display: "none" }}
                        disabled={uploading}
                        onChange={(e) => handleLineArtUpload(e, field.onChange)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("lineart-upload")?.click()}
                        disabled={uploading}
                      >
                        {uploading ? "Uploading..." : "Upload from device"}
                      </Button>
                    </div>
                    {lineArtPreview && (
                      <div className="mt-4">
                        <img src={lineArtPreview} alt="Line Art Preview" className="w-full max-h-64 object-contain border rounded" />
                      </div>
                    )}
                  </>
                </FormControl>
                <FormDescription>
                  URL to the line art image for traditional contests or reference image for digital contests (optional when updating)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date (starts at 11:00 UTC)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>The contest will start at 11:00 UTC on the selected date and end 24 hours later.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Computed Start / End (read-only)</FormLabel>
              <div className="p-3 rounded border bg-muted">
                <div className="text-sm">Start: {startDisplay || "—"}</div>
                <div className="text-sm">End: {endDisplay || "—"}</div>
                <div className="text-xs text-muted-foreground mt-2">Times are fixed at 11:00 UTC and cannot be edited.</div>
              </div>
            </FormItem>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingContest ? "Updating Contest..." : "Creating Contest..."}
                </>
              ) : editingContest ? (
                "Update Contest"
              ) : (
                "Create Contest"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
