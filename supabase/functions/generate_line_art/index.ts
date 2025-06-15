// Self-contained edge function with no external dependencies

// Define CORS headers directly in this file
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  // Always return the same placeholder image regardless of request
  const placeholderResponse = {
    id: `placeholder-${new Date().toISOString().split("T")[0]}`,
    date: new Date().toISOString().split("T")[0],
    title: "Woodland Creatures Mandala",
    description:
      "A beautiful line art featuring woodland creatures including an owl, fox, and rabbit surrounded by flowers and a mandala pattern.",
    imageUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    bwImageUrl:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80",
    keywords: [
      "woodland",
      "animals",
      "mandala",
      "nature",
      "detailed",
      "intricate",
    ],
    artStyle: "standard",
  };

  return new Response(JSON.stringify(placeholderResponse), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
