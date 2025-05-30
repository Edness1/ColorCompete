import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { Contest } from "@shared/schema";
import SubmitEntry from "@/components/contest/SubmitEntry";
import { Link } from "wouter";

export default function SubmitArtwork() {
  const [match, params] = useRoute("/submit/:id");
  const [, navigate] = useLocation();
  const contestId = params?.id ? parseInt(params.id) : 0;

  // Fetch contest details
  const { data: contest, isLoading, error } = useQuery<Contest>({
    queryKey: ['/api/contests', contestId],
    enabled: !!contestId,
  });

  // Fetch current user to check if logged in
  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/user/current'],
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingUser && !currentUser && !match) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
    }
  }, [currentUser, isLoadingUser, match, navigate]);

  // Check if contest is active
  const isActive = contest ? new Date(contest.endDate) > new Date() : false;

  if (isLoading || isLoadingUser) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-64 bg-white rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Contest Not Found</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The contest you're looking for doesn't exist or has been removed.</p>
              <Link href="/contests">
                <Button>View All Contests</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <CardTitle>Contest Ended</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>This contest has already ended and is no longer accepting submissions.</p>
              <Link href="/contests">
                <Button>View Active Contests</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Login Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Please log in to submit your artwork to this contest.</p>
              <div className="flex space-x-4">
                <Link href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                  <Button>Log In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline">Sign Up</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Submit Your Artwork</h1>
          <p className="text-center text-gray-600 mb-8">for the "{contest.title}" contest</p>

          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <h2 className="font-semibold text-lg mb-2">Contest Details</h2>
                <p className="text-gray-600 mb-2">{contest.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span>Entry Fee: ${contest.entryFee.toFixed(2)}</span>
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <span>Prize: ${contest.prizeAmount}</span>
                  <Separator orientation="vertical" className="h-4 mx-2" />
                  <span>Deadline: {new Date(contest.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              <Separator className="my-6" />

              <SubmitEntry contestId={contestId} />

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">Submission Guidelines:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Make sure your artwork is based on the provided line art</li>
                  <li>Ensure your file is in JPG, PNG, or PDF format</li>
                  <li>Maximum file size is 10MB</li>
                  <li>You can only submit one entry per contest</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
