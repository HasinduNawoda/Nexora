import StaticPageLayout, { Section } from "../../components/StaticPageLayout";
import { SITE } from "../../lib/siteConfig";

const LAST_UPDATED = "July 2026";

export default function PrivacyPolicy() {
  return (
    <StaticPageLayout title="Privacy Policy" subtitle={`Last updated: ${LAST_UPDATED}`}>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        This is a plain-language draft written to accurately describe how {SITE.name} currently
        operates. It hasn't been reviewed by a lawyer. If you start running paid ads, collecting
        data beyond basic site analytics, or serving readers under GDPR/UK GDPR specifically, have
        this reviewed by a qualified professional before relying on it.
      </div>

      <Section heading="Who we are">
        <p>
          {SITE.name} is an independent technology news site. This policy explains what
          information we collect from visitors and how it's used. If you have questions, contact
          us at{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-[#3D5AFE] hover:underline">
            {SITE.contactEmail}
          </a>
          .
        </p>
      </Section>

      <Section heading="Information we collect">
        <p>
          We don't currently require an account to read {SITE.name}, so we don't collect names,
          emails, or passwords from readers. Our hosting and analytics providers automatically log
          standard technical information for every visit — things like IP address, browser type,
          device type, referring page, and pages viewed — the same information almost every
          website collects to keep the site running and understand basic traffic patterns.
        </p>
      </Section>

      <Section heading="Cookies">
        <p>
          We don't currently use advertising or tracking cookies. If that changes — for example,
          if we add a newsletter, comments, or an ad network in the future — this policy will be
          updated first, and we'll add a way for you to control that where required by law.
        </p>
      </Section>

      <Section heading="Third-party links">
        <p>
          Articles and the footer may link to third-party sites and social platforms (including
          Facebook, Instagram, TikTok, and YouTube once those accounts are live). Those platforms
          have their own privacy policies, and we're not responsible for how they handle your
          data.
        </p>
      </Section>

      <Section heading="Children's privacy">
        <p>
          {SITE.name} is not directed at children under 13, and we don't knowingly collect
          personal information from children.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          As {SITE.name} adds features — accounts, a newsletter, comments — this policy will be
          updated to reflect what data those features actually collect. Check back here if you
          want the current version.
        </p>
      </Section>

      <Section heading="Contact">
        <p>
          Questions about this policy can go to{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-[#3D5AFE] hover:underline">
            {SITE.contactEmail}
          </a>
          .
        </p>
      </Section>
    </StaticPageLayout>
  );
}
