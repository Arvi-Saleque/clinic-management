/**
 * Shared container class for marketing sections.
 *
 * Pattern (matches effytechbd.com / dhakaheights.com): the outer <section>
 * is always full-bleed — its background/border spans the entire viewport
 * width, no max-width on the section itself. Only this inner CONTAINER
 * class constrains the actual content, and it's kept wide with minimal
 * side padding rather than a narrow centered column.
 *
 * Usage:
 *   <section className="w-full bg-muted/30">
 *     <div className={CONTAINER}>...</div>
 *   </section>
 */
export const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";
