# Homepage Scroll-Triggered Animation System

> **Target**: Public Homepage (`.luxury-homepage-root`)  
> **Reference**: Smooth scroll-triggered reveal video (SplitText headings, image clip-path curtain reveals, staggered cards, button pops, numbers & badges)  
> **Branch**: `feature/homepage-luxury-redesign-and-motion`  
> **Status**: ✅ **Implemented, Verified & Pushed to Remote (Typecheck 0 Errors)**

---

## 1. Files Changed
* [`src/components/marketing/homepage-motion.tsx`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/components/marketing/homepage-motion.tsx)
* [`src/styles/marketing-homepage-motion.css`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/src/styles/marketing-homepage-motion.css)
* [`result.md`](file:///d:/work/Clients/Health-Clinic-Management/website-code-premium/dental-clinic-workspace/result.md)

---

## 2. Animated Elements & Choreography Across All Sections

### A. Hero Section (`LuxuryHero`)
* **Kicker / Trust Pill**: Slide up (`y: 20 -> 0`) with smooth fade-in (`opacity: 0 -> 1`).
* **Headline**: Word-by-word mask reveal using GSAP `SplitText` (`yPercent: 120 -> 0`, stagger `0.055s`).
* **Editorial Description**: Smooth slide up & fade (`y: 24 -> 0`).
* **CTA Buttons**: Staggered pop-in and rise (`y: 20 -> 0`, `scale: 0.94 -> 1`, `opacity: 0 -> 1`).
* **Feature Chips**: Staggered rise (`y: 16 -> 0`, `stagger: 0.08s`).
* **Slide Controller**: Fade up into position.
* **Hero Content Parallax**: Subtle scroll scrub fade and translate on downward scroll.

### B. Number Panels / Metric Stats (`.number-panels`)
* **Metric Cards**: Staggered rise & scale-in (`y: 45 -> 0`, `scale: 0.95 -> 1`, `stagger: 0.1s`).

### C. Story / Intro Section (`#story`)
* **Subtitle Badge**: Letter-spacing settle & slide up (`y: 16 -> 0`).
* **Headline**: SplitText word-by-word reveal.
* **Body Paragraphs**: Staggered rise (`y: 26 -> 0`, `stagger: 0.12s`).
* **Button Group**: Pop-in with slight scale settle (`scale: 0.94 -> 1`).
* **Editorial Image**: Luxury curtain clip-path reveal (`clipPath: inset(12% 0% 0% 10% round 28px) -> inset(0% round 28px)`), scale-down settle (`scale: 1.06 -> 1.0`), and subtle scroll scrub parallax.

### D. Treatment Journey Section (`#journey`)
* **Header Badge**: Fade & rise (`y: 16 -> 0`).
* **Section Title**: SplitText words reveal.
* **Subtitle**: Smooth fade up (`y: 22 -> 0`).
* **SVG Signature Mark**: `DrawSVG` from `0% -> 100%`, then `MorphSVG` into smooth smile curve.
* **4 Journey Step Cards**: Staggered 3D entrance (`y: 50 -> 0`, `scale: 0.94 -> 1`, `stagger: 0.12s`).
* **Card Inner Badges & Icons**: Step number pill pop (`scale: 0.75 -> 1`) and icon gentle rotation settle.
* **Bottom Trust Bar**: Staggered checkmark items + CTA pop-in.

### E. Our Dental Treatments Section (`#treatments`)
* **Subtitle Badge**: Slide up & fade.
* **Section Title**: SplitText words reveal.
* **Divider Line**: Expands outward from center (`scaleX: 0 -> 1`).
* **4 Treatment Cards**: Staggered 3D entrance (`y: 55 -> 0`, `scale: 0.95 -> 1`, `stagger: 0.12s`).
* **Card Background Imagery**: Continuous scroll scrub parallax (`yPercent: -5% -> 5%`).
* **Centered CTA Button**: Rise & scale pop, with magnetic cursor interaction on desktop.

### F. Why Choose Our Practice (`#why-choose`)
* **Left Column**: Subtitle, SplitText headline, paragraphs, and CTA button entrance.
* **Right Column (Desktop >= 1025px)**: Pinned 4-card stack storytelling timeline (cards glide in, layer with scale and depth shadow).
* **Right Column (Mobile / Tablet)**: Staggered natural scroll entrance (`y: 35 -> 0`, `stagger: 0.12s`).

### G. Smile Preferences 3D Simulator (`#smile-simulator`)
* **Left 3D Preview Column**: Slide-in from left (`x: -45 -> 0`, `scale: 0.95 -> 1`) + HUD badge stagger.
* **Right Controls Column**:
  - Subtitle, SplitText headline, and intro text entrance.
  - Treatment pills: Staggered slide (`y: 18 -> 0`, `stagger: 0.06s`).
  - Shade circle buttons: Staggered scale pop (`scale: 0.88 -> 1`, `stagger: 0.05s`).
  - Shape buttons: Staggered slide (`y: 18 -> 0`, `stagger: 0.06s`).
  - Bottom action box & disclaimer: Slide up into place.

### H. Before & After Showcase (`#results`)
* **Section Header**: Subtitle, SplitText headline, and description entrance.
* **2 Before/After Slider Cards**: Staggered rise and scale (`y: 50 -> 0`, `scale: 0.96 -> 1`, `stagger: 0.16s`).
* **"Explore Smile Gallery" CTA**: Pop & rise into view.

### I. Marquee Text Banner (`.marquee-text`)
* Continuous infinite marquee glide with dynamic velocity responsiveness on scroll.

### J. Flexible Payment Options (`.price-guide`)
* **Left Text Box**: Kicker, SplitText headline, paragraphs, and enquire button slide in from left (`x: -28 -> 0`).
* **Right Image Card**: Glides in from right (`x: 40 -> 0`, `scale: 0.96 -> 1`) with scroll scrub parallax.

### K. Frequently Asked Questions (`#faq-section`)
* **Header**: Eyebrow badge, SplitText headline, and intro text entrance.
* **Accordion Rows**: Staggered entrance (`y: 28 -> 0`, `stagger: 0.08s`).

### L. Footer (`.luxury-site-footer`)
* **Top Consultation Banner**: Slide up & fade in (`y: 35 -> 0`).
* **Navigation Columns**: Staggered rise (`y: 30 -> 0`, `stagger: 0.08s`).
* **Bottom Bar**: Clean fade-in.