import Hero from "@/components/home/Hero";
import CurrentContest from "@/components/home/CurrentContest";
import ContestGallery from "@/components/home/ContestGallery";
import Leaderboard from "@/components/home/Leaderboard";
import UploadSection from "@/components/home/UploadSection";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import PricingPlans from "@/components/home/PricingPlans";
import CTA from "@/components/home/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <CurrentContest />
      <ContestGallery />
      <Leaderboard />
      <UploadSection />
      <HowItWorks />
      <Testimonials />
      <PricingPlans />
      <CTA />
    </>
  );
}
