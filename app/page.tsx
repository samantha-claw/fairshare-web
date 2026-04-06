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

      {/* Features grid */}
      <FeaturesSection />

      {/* How it works */}
      <HowItWorksSection />

      {/* Stats */}
      <StatsSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <FAQSection />

      {/* Final CTA */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
