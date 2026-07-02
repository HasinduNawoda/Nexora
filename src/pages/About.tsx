import StaticPageLayout, { Section } from "../components/StaticPageLayout";

export default function About() {
  return (
    <StaticPageLayout title="About Nexora">
      <Section heading="What Nexora is">
        <p>
          Nexora is an independent news site covering artificial intelligence, software
          development, cybersecurity, hardware, and other emerging technology. 
        </p>
      </Section>

      <Section heading="Why it exists">
        <p>
          Most tech coverage is either too shallow to be useful to people who actually build
          things, or too dense to read quickly. Nexora aims for the middle: short, accurate
          write-ups that respect your time, focused on AI, dev tooling, security, and hardware —
          nothing else.
        </p>
      </Section>

      <Section heading="Where to find us">
        <p>
          Nexora publishes on the web and shares article summaries, carousels, and short-form
          video across social platforms as those accounts come online. 
        </p>
      </Section>

      <Section heading="Get in touch">
        <p>
          Questions, corrections, or story tips — reach out anytime through the contact links in
           below.
        </p>
      </Section>
    </StaticPageLayout>
  );
}
