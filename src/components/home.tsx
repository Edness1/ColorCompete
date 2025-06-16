import { Link } from "react-router-dom";
import {
  Palette,
  Award,
  Image,
  Trophy,
  Users,
  Calendar,
  Star,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import ActiveContest from "./ActiveContest";
import { MainHeader } from "./header";

const Home = () => {

  // Mock data for recent submissions
  const recentSubmissions = [
    {
      id: 1,
      imageUrl:
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80",
      artistName: "Jane Cooper",
      votes: 42,
    },
    {
      id: 2,
      imageUrl:
        "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=300&q=80",
      artistName: "Alex Morgan",
      votes: 38,
    },
    {
      id: 3,
      imageUrl:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80",
      artistName: "Sam Wilson",
      votes: 35,
    },
    {
      id: 4,
      imageUrl:
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&q=80",
      artistName: "Taylor Reed",
      votes: 29,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <MainHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              Daily Coloring Challenge
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Download today's line art, color it your way, and submit for a
              chance to win prizes!
            </p>
          </div>

          {/* Featured Contest Component */}
          <div className="flex flex-col gap-4">
            <ActiveContest />
          </div>
        </section>

        {/* Platform Features Carousel */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Platform Features
          </h2>
          <div className="max-w-4xl mx-auto">
            <Carousel className="w-full">
              <CarouselContent>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Palette className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Daily Challenges
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Fresh line art every day with unique themes and styles
                          to keep your creativity flowing.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Users className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Community Voting
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Let the community decide the winners through fair and
                          transparent voting system.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Trophy className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Win Prizes
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Compete for exciting prizes and recognition in our
                          daily contests.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Calendar className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Timed Contests
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Each contest has a deadline, creating excitement and
                          urgency for participants.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Image className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Gallery Showcase
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Browse through amazing artwork from talented artists
                          around the world.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
                <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center h-full">
                        <div className="bg-primary/10 p-3 rounded-full mb-4">
                          <Star className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                          Artist Profiles
                        </h3>
                        <p className="text-muted-foreground flex-grow">
                          Track your progress, view your submissions, and build
                          your artistic reputation.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Palette className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">1. Download</h3>
                  <p className="text-muted-foreground">
                    Get today's line art and unleash your creativity with
                    colors.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Image className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">2. Submit</h3>
                  <p className="text-muted-foreground">
                    Upload your colored masterpiece before the deadline.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-primary/10 p-3 rounded-full mb-4">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">3. Win</h3>
                  <p className="text-muted-foreground">
                    Get votes from the community and win exciting prizes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Submissions */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Submissions</h2>
            <Link to="/gallery">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentSubmissions.map((submission) => (
              <Card key={submission.id} className="overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={submission.imageUrl}
                    alt={`Artwork by ${submission.artistName}`}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{submission.artistName}</p>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-1">
                        {submission.votes}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-primary"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-primary/5 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Showcase Your Talent?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join our community of artists and participate in daily coloring
            contests. Show off your skills and win amazing prizes!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg">Start Coloring Today</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Palette className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ColorCompete</span>
            </div>
            <div className="flex space-x-6">
              <Link
                to="/about"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contact
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
            </div>
          </div>
          <Separator />
          <div className="pt-6 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} ColorCompete. All rights
              reserved.
            </p>
            <p className="mt-2">
              A portion of all submission fees is donated to support art
              education programs for underserved communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
