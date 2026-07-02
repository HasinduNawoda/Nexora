// Single source of truth for contact + social links.
//
// To add a social account once it exists: paste its URL below. The footer
// automatically shows/hides each icon based on whether a URL is set here —
// no other file needs to change.

export const SITE = {
  name: "Nexora",
  tagline: "AI & Technology, dispatched daily",
  contactEmail: "hasindunawoda78@gmail.com",
  /** International format, no "+" or leading 0 — used to build the wa.me link. */
  whatsappNumber: "94782703813",
};

export const SOCIAL_LINKS = {
  facebook: "",
  instagram: "",
  tiktok: "",
  youtube: "",
};

export const CONTACT_LINKS = {
  email: `mailto:${SITE.contactEmail}`,
  whatsapp: `https://wa.me/${SITE.whatsappNumber}`,
};
