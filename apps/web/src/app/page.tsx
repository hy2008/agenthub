import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoCloud } from "@/components/landing/logo-cloud";
import { FeatureRows } from "@/components/landing/feature-rows";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <LogoCloud />
      <FeatureRows />
      <HowItWorks />
      <CTASection />
      <Footer />
    </div>
  );
}