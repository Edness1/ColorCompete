import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
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
import axios from "axios"; // Add this import

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  lineArt: z.string().optional(), // Make lineArt optional
  startTime: z.string().min(1, "Start time is required"), // added
  endTime: z.string().min(1, "End time is required"),     // added
  contestType: z.enum(["traditional", "digital"]),
  status: z.enum(["draft", "scheduled", "active", "completed"]),
});

interface ContestManagementProps {
  onSuccess?: () => void;
  editingContest?: Contest | null;
}

interface Contest {
  _id: string;
  title: string;
  description: string;
  lineArt: string;
  startTime: string;
  endTime: string;
  contestType: "traditional" | "digital";
  status: "draft" | "scheduled" | "active" | "completed";
}

const CLOUDINARY_UPLOAD_PRESET = "cewqtwou"; // <-- set this
const CLOUDINARY_CLOUD_NAME = "dwnqwem6e"; // <-- set this

export default function ContestManagement({
  onSuccess,
  editingContest,
}: ContestManagementProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lineArtPreview, setLineArtPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingContest?.title || "",
      description: editingContest?.description || "",
      lineArt: editingContest?.lineArt || "",
      startTime: editingContest?.startTime || "09:00",
      endTime: editingContest?.endTime || "17:00",
      contestType: editingContest?.contestType || "traditional",
      status: editingContest?.status || "draft",
    },
  });

  // Update form values when editingContest changes
  useEffect(() => {
    if (editingContest) {
      form.reset({
        title: editingContest.title,
        description: editingContest.description,
        lineArt: editingContest.lineArt,
        startTime: editingContest.startTime,
        endTime: editingContest.endTime,
        contestType: editingContest.contestType,
        status: editingContest.status,
      });
      setLineArtPreview(editingContest.lineArt);
    } else {
      form.reset({
        title: "",
        description: "",
        lineArt: "",
        startTime: "09:00",
        endTime: "17:00",
        contestType: "traditional",
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
      // Optionally show a toast or error message
    }
    setUploading(false);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Prepare the data object
      const contestData = {
        title: values.title,
        description: values.description,
        startTime: values.startTime,
        endTime: values.endTime,
        contestType: values.contestType,
        status: values.status,
        startDate: new Date(), // Add current date as start date
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Add end date (24 hours from now)
        ...(values.lineArt && { lineArt: values.lineArt }), // Only include lineArt if it's provided
      };

      if (editingContest) {
        // Update existing contest
        await axios.put(API_URL + `/api/challenges/${editingContest._id}`, contestData);

        toast({
          title: "Contest updated",
          description: `${values.title} has been successfully updated.`,
        });
      } else {
        // Create new contest - lineArt is required for new contests
        if (!values.lineArt) {
          toast({
            title: "Error",
            description: "Line art image is required for new contests.",
            variant: "destructive",
          });
          return;
        }
        
        await axios.post(API_URL + "/api/challenges", contestData);

        toast({
          title: "Contest created",
          description: `${values.title} has been successfully created.`,
        });
      }

      // Reset form only if creating new contest
      if (!editingContest) {
        form.reset();
        setLineArtPreview(null);
      }

      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving contest:", error);
      toast({
        title: "Error",
        description: `Failed to ${editingContest ? 'update' : 'create'} contest. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background p-6 rounded-lg border">
      <h2 className="text-2xl font-bold mb-6">
        {editingContest ? 'Edit Contest' : 'Create New Contest'}
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
                <FormDescription>
                  Give your contest a catchy, descriptive title
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the contest theme and guidelines"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide clear instructions and inspiration for participants
                </FormDescription>
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
                    <Input 
                      placeholder="Enter image URL (optional)" 
                      {...field}
                      value={field.value || ''}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        id="lineart-upload"
                        style={{ display: "none" }}
                        disabled={uploading}
                        onChange={e => handleLineArtUpload(e, field.onChange)}
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
                        <img
                          src={lineArtPreview}
                          alt="Line Art Preview"
                          className="w-full max-h-64 object-contain border rounded"
                        />
                      </div>
                    )}
                  </>
                </FormControl>
                <FormDescription>
                  URL to the line art image for traditional contests or
                  reference image for digital contests (optional when updating)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contest Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contest type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="traditional">
                        Traditional (Color the provided line art)
                      </SelectItem>
                      <SelectItem value="digital">
                        Digital (Create original artwork based on theme)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingContest ? 'Updating Contest...' : 'Creating Contest...'}
                </>
              ) : (
                editingContest ? 'Update Contest' : 'Create Contest'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
