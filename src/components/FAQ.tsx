import React from "react";
import { Link } from "react-router-dom";
import { Palette, User, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "./ui/use-toast";
import { MainHeader } from "./header";
import { MainFooter } from "./footer";

const FAQ = () => {
  const { user, signOut, isLoading } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const faqData = [
    {
      question: "How do I participate in a coloring contest?",
      answer:
        "Simply download the daily line art from our home page, color it using your preferred medium (digital or traditional), and upload your finished artwork before the deadline. Make sure to follow the submission guidelines for the best results.",
    },
    {
      question: "What file formats are accepted for submissions?",
      answer:
        "We accept JPG, PNG, and PDF files. Your submission should be high-quality (at least 300 DPI) and clearly show your colored artwork. Maximum file size is 10MB.",
    },
    {
      question: "How does the voting system work?",
      answer:
        "Community members can vote on submissions using our heart system. Each user gets one vote per submission. Voting is open to all registered users, regardless of their subscription tier.",
    },
    {
      question: "When are contest winners announced?",
      answer:
        "Winners are typically announced 24-48 hours after the contest deadline. You'll be notified via email if you win, and results are posted on our leaderboard.",
    },
    {
      question: "What prizes can I win?",
      answer:
        "Prizes vary by contest but may include art supplies, digital tools, gift cards, and featured placement on our platform. Premium subscribers have access to exclusive contests with larger prizes.",
    },
    {
      question: "Can I submit multiple entries per contest?",
      answer:
        "This depends on your subscription tier. Free users get 2 submissions per month, while paid subscribers get more based on their plan. Check your profile to see your current limits.",
    },
    {
      question: "Is there an age requirement to participate?",
      answer:
        "Users under 13 need parental consent. Users 13-17 need parental permission to participate in contests with monetary prizes. All ages are welcome to join our creative community!",
    },
    {
      question: "Can I use digital tools to color the line art?",
      answer:
        "Absolutely! You can use any coloring method you prefer - digital apps, traditional media like colored pencils or markers, or a combination of both.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel your subscription anytime from your profile settings. Your access will continue until the end of your current billing period.",
    },
    {
      question: "What happens if I miss a contest deadline?",
      answer:
        "Unfortunately, late submissions cannot be accepted to ensure fairness. However, there's always tomorrow's contest to participate in!",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navigation */}
      <MainHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            Frequently Asked Questions
          </h1>

          <div className="mb-8">
            <p className="text-lg text-muted-foreground text-center">
              Find answers to common questions about ColorCompete contests,
              submissions, and more.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 bg-primary/5 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to
              help!
            </p>
            <Link to="/contact">
              <Button size="lg">Contact Support</Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <MainFooter />
    </div>
  );
};

export default FAQ;
