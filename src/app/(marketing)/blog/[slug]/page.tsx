import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

interface Article {
  title: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  image: string;
  content: string[];
}

const articlesDatabase: Record<string, Article> = {
  "porcelain-vs-composite-veneers-comparison": {
    title: "Porcelain Veneers vs. Composite Bonding: Which Is Best for Your Smile?",
    category: "Cosmetic Dentistry",
    date: "August 10, 2026",
    readTime: "5 min read",
    author: "Clinic Care Clinical Team",
    image: "/marketing/ceramist_artistry.jpg",
    content: [
      "When considering a smile makeover, one of the most common questions patients ask is whether to choose handcrafted porcelain veneers or direct composite bonding. Both treatments can dramatically elevate the aesthetics of your smile, but their durability, appearance, preparation, and investment differ significantly.",
      "### What Are Porcelain Veneers?",
      "Porcelain veneers are ultra-thin shells of medical-grade glass-ceramic custom-sculpted in a dental lab. They possess the optical translucency and light refraction properties of natural tooth enamel, making them virtually indistinguishable from organic teeth. They are generally more stain resistant than composite resin, while longevity varies with bite, oral health, habits, maintenance, and individual clinical factors.",
      "### What Is Composite Bonding?",
      "Composite resin is applied directly onto the tooth surface by the dentist and sculpted chairside in a single appointment. While cost-effective and minimally invasive, composite resin is more porous than glazed ceramic, and may require polishing, repair, or replacement over time depending on use and individual clinical factors.",
      "### Comparison Summary",
      "- **Material longevity**: Both materials require maintenance; expected lifespan varies by patient and clinical situation.\n- **Stain resistance**: Porcelain is generally more stain resistant; composite may need periodic polishing.\n- **Aesthetic character**: Both can be matched to natural teeth using different techniques and materials.\n- **Appointment timeframe**: Timing depends on the treatment plan and the amount of work required.",
      "### Which Option Is Right For You?",
      "The more suitable option depends on the condition of your teeth, the amount of change required, maintenance expectations, budget, and your clinician’s assessment.",
    ],
  },
  "comfort-focused-dentistry-guide": {
    title: "How Modern Comfort-Focused Care Eases Dental Visits",
    category: "Patient Comfort",
    date: "August 04, 2026",
    readTime: "4 min read",
    author: "Clinic Care Clinical Team",
    image: "/marketing/hero_dentist.png",
    content: [
      "Many adults experience hesitation or unease before visiting the dentist. Modern clinical dentistry focuses on gentle techniques, transparent communication, and patient-first pacing to ensure every visit is relaxing and reassuring.",
      "### Clear Communication & Control",
      "During your consultation, our clinicians explain each procedure step-by-step. You are always in full control of your appointment, with agreed hand signals to take breaks whenever needed.",
      "### Gentle Anaesthesia",
      "Local anaesthesia may be used when clinically appropriate to numb the treatment area. Your clinician can explain what to expect and discuss comfort options before treatment.",
    ],
  },
  "all-on-implants-procedure-timeline": {
    title: "All-On Implants™: Procedure Timeline, Bone Health, and Long-Term Care",
    category: "Implantology",
    date: "July 28, 2026",
    readTime: "6 min read",
    author: "Clinic Care Clinical Team",
    image: "/marketing/hero_implant.png",
    content: [
      "Dental implants can replace missing tooth roots by supporting crowns or bridges from fixtures placed in the jawbone. Suitability and expected function depend on bone health, oral health, treatment planning, and individual clinical factors.",
      "### 3D Guided Planning",
      "Three-dimensional imaging can help clinicians assess bone volume and nearby anatomy when planning implant treatment.",
      "### Healing and Integration",
      "Healing and osseointegration take time and vary between patients. Your clinician will review healing before the final restoration stage.",
    ],
  },
  "invisalign-habits-for-clear-results": {
    title: "5 Essential Daily Habits for Optimal Invisalign® Progress",
    category: "Orthodontics",
    date: "July 19, 2026",
    readTime: "4 min read",
    author: "Clinic Care Clinical Team",
    image: "/marketing/hero_aligners.png",
    content: [
      "Invisalign clear aligners offer a discreet, wire-free method to straighten crowded or spaced teeth. Adhering to key daily habits ensures your treatment stays on track.",
      "### 1. Wear Aligners 20–22 Hours Daily",
      "Only remove your aligners for eating, drinking non-water beverages, brushing, and flossing.",
      "### 2. Rinse and Clean Regularly",
      "Keep aligners clear by gently brushing them with lukewarm water and mild soap.",
      "### 3. Store Safely in Your Case",
      "Always store aligners in their protective case when not in your mouth to avoid damage or loss.",
    ],
  },
  "safe-teeth-whitening-enamel-care": {
    title: "The Science of Safe Teeth Whitening: Protecting Enamel and Preventing Sensitivity",
    category: "Oral Health",
    date: "July 11, 2026",
    readTime: "5 min read",
    author: "Clinic Care Clinical Team",
    image: "/marketing/hero_smile.png",
    content: [
      "Professional whitening uses clinically controlled bleaching agents to reduce certain tooth stains. Suitability and sensitivity risk should be assessed before treatment.",
      "### Professional In-Chair Bleaching",
      "In-chair treatments use whitening gels under controlled clinical conditions with measures intended to protect the surrounding soft tissues.",
      "### Protecting Tooth Enamel",
      "Abrasive products can contribute to surface wear if misused. A dental professional can advise on whitening options and enamel-safe oral care for your situation.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articlesDatabase[slug];
  return {
    title: `${article?.title || "Article"} | Clinic Care Dental`,
    description: article?.content[0] || "Dental health and cosmetic dentistry insights.",
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articlesDatabase[slug];
  if (!article) notFound();

  return (
    <div className="article-detail-page">
      <main>
        {/* Article Banner */}
        <section className="article-header-section py-20 bg-[#273338] text-white">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-2 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span>/</span>
              <span className="text-[#9CB080] truncate">{article.category}</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-xs text-[#9CB080] font-semibold mb-4">
              <span>{article.category}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white leading-tight mb-6">
              {article.title}
            </h1>

            <p className="text-xs text-white/60 mb-8">
              Published on {article.date} • By {article.author}
            </p>

            <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl">
              <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="article-body-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-3xl mx-auto px-4">
            <div className="prose prose-lg max-w-none text-[#414a4c] space-y-6">
              {article.content.map((paragraph, idx) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={idx} className="text-2xl font-medium text-[#273338] mt-8 mb-4">
                      {paragraph.replace("### ", "")}
                    </h3>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <ul key={idx} className="list-disc pl-6 space-y-2 text-sm sm:text-base my-4">
                      {paragraph.split("\n").map((line, lIdx) => (
                        <li key={lIdx}>{line.replace("- ", "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-base sm:text-lg leading-relaxed">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Article Footer CTA */}
            <div className="mt-16 p-8 rounded-3xl bg-white border border-[#273338]/10 shadow-md text-center">
              <h3 className="text-xl font-medium text-[#273338] mb-2">Have Questions About This Treatment?</h3>
              <p className="text-sm text-[#414a4c] mb-6">
                Our clinical team is happy to answer your questions and evaluate your individual smile goals.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/book" className="btn-blue">
                  <CalendarDays className="w-4 h-4 mr-2 inline" />
                  Book Appointment Online
                </Link>
                <Link href="/contact" className="btn-stroke text-[#273338] border-[#273338]/30">
                  Contact Clinic
                </Link>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link href="/blog" className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[#2B5748] hover:text-[#9CB080]">
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                <span>Return to All Blog Articles</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
