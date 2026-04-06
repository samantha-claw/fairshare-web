import {
  HeroSection,
  FeatureMarquee,
  FeaturesSection,
  HowItWorksSection,
  TestimonialsSection,
  StatsSection,
  PricingSection,
  FAQSection,
  CTASection,
  FooterSection,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero + Header */}
      <HeroSection />

      {/* Scrolling feature marquee */}
      <FeatureMarquee />

      {/* How it works */}
      <HowItWorksSection />

      {/* Features grid */}
      <FeaturesSection />

      {/* Stats */}
      <StatsSection />

      {/* Pricing */}
      <PricingSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
