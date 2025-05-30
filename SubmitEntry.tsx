import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadCloud } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

const submitFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(100, "Title can't exceed 100 characters"),
  description: z.string().max(500, "Description can't exceed 500 characters").optional(),
  medium: z.enum(["digital", "traditional"], {
    required_error: "Please select the medium you used",
  }),
  imageFile: z.instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 10MB")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png, and .pdf files are accepted"
    ),
});

type SubmitFormValues = z.infer<typeof submitFormSchema>;

interface SubmitEntryProps {
  contestId: number;
}

export default function SubmitEntry({ contestId }: SubmitEntryProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<SubmitFormValues>({
    resolver: zodResolver(submitFormSchema),
    defaultValues: {
      title: "",
      description: "",
      medium: "digital",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Set the file in form
      form.setValue("imageFile", file, { shouldValidate: true });
      
      // Create a preview if it's an image
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        // Show generic PDF icon for PDFs
        setPreview("/pdf-icon.svg");
      }
    }
  };

  const selectFile = () => {
    fileInputRef.current?.click();
  };

  const mutation = useMutation({
    mutationFn: async (data: SubmitFormValues) => {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("medium", data.medium);
      formData.append("image", data.imageFile);
      formData.append("contestId", contestId.toString());

      // Custom fetch since we're sending FormData
      const res = await fetch(`/api/entries`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contests'] });
      
      toast({
        title: "Success!",
        description: "Your artwork has been submitted.",
      });
      
      navigate(`/contests/${contestId}`);
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SubmitFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div 
          className={`border-2 border-dashed ${preview ? 'border-primary' : 'border-gray-300'} rounded-lg p-8 text-center cursor-pointer`}
          onClick={selectFile}
        >
          {preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Preview" className="max-h-48 mx-auto" />
              <p className="text-sm text-primary">Click to change file</p>
            </div>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-secondary mx-auto mb-3" />
              <h3 className="font-poppins font-medium text-lg mb-2">Upload Your Artwork</h3>
              <p className="text-sm text-medium mb-4">Drag and drop your file here, or click to browse</p>
              <Button type="button" variant="secondary" onClick={selectFile}>
                Choose File
              </Button>
              <p className="mt-3 text-xs text-medium">Supported formats: JPG, PNG, PDF (Max 10MB)</p>
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            id="file-upload" 
            accept=".jpg,.jpeg,.png,.pdf" 
            onChange={handleFileChange}
          />
          <FormMessage>{form.formState.errors.imageFile?.message}</FormMessage>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artwork Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for your artwork" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your creation..." 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medium Used</FormLabel>
              <FormControl>
                <RadioGroup 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <RadioGroupItem value="digital" id="digital" className="hidden peer" />
                    <label 
                      htmlFor="digital" 
                      className="block text-center border rounded-lg py-2 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      Digital
                    </label>
                  </div>
                  <div>
                    <RadioGroupItem value="traditional" id="traditional" className="hidden peer" />
                    <label 
                      htmlFor="traditional" 
                      className="block text-center border rounded-lg py-2 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-white peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      Traditional
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Submitting..." : "Submit Entry"}
        </Button>
      </form>
    </Form>
  );
}
