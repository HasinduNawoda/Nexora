import StaticPageLayout, { Section } from "../../components/StaticPageLayout";
import { SITE } from "../../lib/siteConfig";

const LAST_UPDATED = "July 2026";

export default function TermsOfService() {
  return (
    <StaticPageLayout title="Terms of Service" subtitle={`Last updated: ${LAST_UPDATED}`}>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This is a plain-language draft, not written or reviewed by a lawyer. Treat it as a
        reasonable starting point rather than a finished legal document — have it reviewed before
        relying on it for anything beyond a personal project.
      </div>

      <Section heading="Using this site">
        <p>
          By reading {SITE.name}, you agree to these terms. If you don't agree with them, please
          don't use the site. We may update these terms as the site changes; continuing to use{" "}
          {SITE.name} after an update means you accept the revised terms.
        </p>
      </Section>

      <Section heading="Content">
        <p>
          Articles, graphics, and branding on {SITE.name} belong to {SITE.name} unless otherwise
          noted. You're welcome to link to our articles and share short excerpts with credit and a
          link back. Republishing full articles or using our content to train other products
          without permission isn't allowed.
        </p>
      </Section>

      <Section heading="Accuracy">
        <p>
          We aim to be accurate and will correct genuine errors when they're pointed out, but
          technology news moves fast and we can't guarantee every detail stays current after
          publication. Nothing on {SITE.name} is professional advice — always verify anything
          load-bearing (security guidance, technical specifications, pricing) against a primary
          source before acting on it.
        </p>
      </Section>

      <Section heading="Third-party links">
        <p>
          We link to other sites and to our own social accounts (Facebook, Instagram, TikTok,
          YouTube). We don't control those sites and aren't responsible for their content or
          availability.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          {SITE.name} is provided "as is." We do our best to keep it available and accurate, but
          we don't guarantee the site will be error-free or uninterrupted.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about these terms can go to{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-[#3D5AFE] hover:underline">
            {SITE.contactEmail}
          </a>
          .
        </p>
      </Section>
    </StaticPageLayout>
  );
}
