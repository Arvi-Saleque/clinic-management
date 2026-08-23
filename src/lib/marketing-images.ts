/**
 * Curated stock photography for the marketing site, sourced from Unsplash
 * (free tier — commercial use, no attribution required under the Unsplash
 * License: https://unsplash.com/license). Every ID below was verified live
 * before use. Centralising them here means swapping in real clinic photos
 * later is a one-file edit, not a hunt through every component.
 */

interface UnsplashImage {
  id: string;
  alt: string;
}

export interface LocalImage {
  src: string;
  alt: string;
}

function unsplashUrl(id: string, width: number) {
  return `https://images.unsplash.com/photo-${id}?q=80&w=${width}&auto=format&fit=crop`;
}

export function imageSrc(image: UnsplashImage, width = 1600) {
  return unsplashUrl(image.id, width);
}

/** Resolves a curated Unsplash entry to the `{src, alt}` shape PageBanner/Image consumers expect. */
export function toImageProp(image: UnsplashImage, width = 1920) {
  return { src: imageSrc(image, width), alt: image.alt };
}

export interface HeroSlide {
  image: UnsplashImage;
  eyebrow: string;
  /** Headline with the accent-colored word/phrase separated out. */
  headline: string;
  headlineAccent: string;
  subtext: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    image: {
      id: "1704455306251-b4634215d98f",
      alt: "A bright, modern dental treatment room",
    },
    eyebrow: "Now accepting new patients",
    headline: "Exceptional care, designed around",
    headlineAccent: "you.",
    subtext:
      "Advanced dentistry with a calm, personal approach — from your first visit to lasting confidence.",
  },
  {
    image: {
      id: "1667133295315-820bb6481730",
      alt: "Dentist examining a patient with a dental scanner",
    },
    eyebrow: "Meet your care team",
    headline: "Real expertise, real",
    headlineAccent: "conversations.",
    subtext:
      "Every visit starts with listening — clear explanations, honest options, and a plan built around your goals.",
  },
  {
    image: {
      id: "1677026010083-78ec7f1b84ed",
      alt: "Close-up of a healthy, bright smile",
    },
    eyebrow: "Cosmetic & restorative dentistry",
    headline: "A smile you'll want to",
    headlineAccent: "show off.",
    subtext:
      "From whitening to veneers and implants, we help you get results that feel as natural as they look.",
  },
];

export const STORY_IMAGE: UnsplashImage = {
  id: "1681939282781-341ac4f61996",
  alt: "Dentist talking through a treatment plan with a patient",
};

export const STORY_DETAIL_IMAGE: UnsplashImage = {
  id: "1643660527098-559f89e45a92",
  alt: "Dental treatment room with chair and monitor",
};

export const TECHNOLOGY_IMAGE: UnsplashImage = {
  id: "1643660527217-b5e025ac642e",
  alt: "Close-up of precision dental instruments",
};

export const COMFORT_IMAGE: UnsplashImage = {
  id: "1619596662481-085e45d69762",
  alt: "A calm, comfortable seating area with natural light",
};

export const SERVICE_CATEGORY_IMAGES: Record<string, UnsplashImage> = {
  General: { id: "1606811971618-4486d14f3f99", alt: "Dental exam with mirror and tool" },
  Hygiene: { id: "1609840113564-ab4aba4956c4", alt: "Teeth cleaning and hygiene check" },
  Cosmetic: { id: "1489278353717-f64c6ee8a4d2", alt: "Bright, cosmetic-ready smile" },
  Restorative: { id: "1643660527072-47bd5735f721", alt: "Restorative dentistry instruments" },
  Orthodontics: { id: "1667133295315-820bb6481730", alt: "Orthodontic consultation" },
  Children: { id: "1609840113564-ab4aba4956c4", alt: "Gentle paediatric dental care" },
};

export const SERVICE_IMAGE_FALLBACK: UnsplashImage = {
  id: "1722586663955-2f96a4c1f255",
  alt: "Dental operatory chair and overhead light",
};

export const PRACTITIONER_PHOTO_FALLBACKS: LocalImage[] = [
  { src: "/marketing/practitioners/dr-charlotte-hughes.webp", alt: "Fictional UK dentist in a modern surgery" },
  { src: "/marketing/practitioners/dr-oliver-bennett.webp", alt: "Fictional UK dentist in a modern surgery" },
];

export const PAGE_BANNERS = {
  about: { id: "1722586663955-2f96a4c1f255", alt: "Inside a modern dental clinic" },
  services: { id: "1643660527098-559f89e45a92", alt: "Dental treatment room with monitor" },
  practitioners: { id: "1638202993928-7267aad84c31", alt: "Clinician with a stethoscope" },
  contact: { id: "1762625570087-6d98fca29531", alt: "Bright, modern clinic waiting room" },
  book: { id: "1606811971618-4486d14f3f99", alt: "Dental exam with mirror and tool" },
} satisfies Record<string, UnsplashImage>;

export const BOOKING_CTA_IMAGE: UnsplashImage = {
  id: "1755995083683-50d08cd83d09",
  alt: "Bright, calm clinic corridor",
};

export const TESTIMONIAL_AVATARS: Record<string, UnsplashImage> = {
  "Emma C.": { id: "1494790108377-be9c29b29330", alt: "Portrait of Emma C." },
  "Daniel H.": { id: "1500648767791-00dcc994a43e", alt: "Portrait of Daniel H." },
  "Lucy W.": { id: "1534528741775-53994a69daeb", alt: "Portrait of Lucy W." },
};

/** Deterministic pick from a pool, stable per id (no layout shift between renders). */
export function pickFromPool<T>(pool: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length];
}
