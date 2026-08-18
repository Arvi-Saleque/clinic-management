"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

const blogArticles = [
  {
    slug: "porcelain-vs-composite-veneers-comparison",
    title: "Porcelain Veneers vs. Composite Bonding: Which Is Best for Your Smile?",
    category: "Cosmetic Dentistry",
    date: "August 10, 2026",
    readTime: "5 min read",
    image: "/marketing/ceramist_artistry.jpg",
    excerpt: "Explore the differences in durability, stain resistance, and tooth preparation between handcrafted porcelain veneers and chairside composite bonding.",
  },
  {
    slug: "comfort-focused-dentistry-guide",
    title: "How Modern Comfort-Focused Care Eases Dental Visits",
    category: "Patient Comfort",
    date: "August 04, 2026",
    readTime: "4 min read",
    image: "/marketing/hero_dentist.png",
    excerpt: "Learn how gentle local anaesthesia, attentive clinical pacing, and calming clinic environments make visiting the dentist a relaxing experience.",
  },
  {
    slug: "all-on-implants-procedure-timeline",
    title: "All-On Implants™: Procedure Timeline, Bone Health, and Long-Term Care",
    category: "Implantology",
    date: "July 28, 2026",
    readTime: "6 min read",
    image: "/marketing/hero_implant.png",
    excerpt: "Everything you need to know about full-arch tooth replacement, from 3D diagnostic planning to permanent zirconia bridge maintenance.",
  },
  {
    slug: "invisalign-habits-for-clear-results",
    title: "5 Essential Daily Habits for Optimal Invisalign® Progress",
    category: "Orthodontics",
    date: "July 19, 2026",
    readTime: "4 min read",
    image: "/marketing/hero_aligners.png",
    excerpt: "Maintain aligner clarity, optimize tooth tracking, and ensure your smile transformation stays on schedule with consistent daily routines.",
  },
  {
    slug: "safe-teeth-whitening-enamel-care",
    title: "The Science of Safe Teeth Whitening: Protecting Enamel and Preventing Sensitivity",
    category: "Oral Health",
    date: "July 11, 2026",
    readTime: "5 min read",
    image: "/marketing/hero_smile.png",
    excerpt: "A practical look at whitening approaches, sensitivity considerations, and why professional assessment matters before treatment.",
  },
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredArticles = blogArticles.filter((art) =>
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    art.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="blog-page">
      <main>
        {/* Blog Hero Banner */}
        <section className="page-hero-banner py-20 bg-[#273338] text-white">
          <div className="container text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs text-[#9CB080] font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dental Education &amp; Clinical Insights</span>
            </div>
            <h1 className="page-title text-4xl sm:text-5xl md:text-6xl font-light tracking-tight leading-tight">
              The Smile Wellness Journal. <br />
              <i className="font-serif text-[#9CB080]">Insights from Experienced Dentists.</i>
            </h1>
            <p className="page-subtitle text-base sm:text-lg text-white/75 mt-6 max-w-2xl mx-auto leading-relaxed">
              Practical dental health guidance, treatment explainers, aftercare topics, and clinic insights to help you make informed decisions.
            </p>

            {/* Live Search Filter */}
            <div className="max-w-xl mx-auto mt-8 relative">
              <input
                type="text"
                placeholder="Search articles (Veneers, Implants, Invisalign, Whitening)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-[#9CB080] backdrop-blur-md"
              />
              <Search className="w-5 h-5 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </section>

        {/* Featured Article Card */}
        {blogArticles[0] && !searchTerm && (
          <section className="featured-article-section py-12 bg-[#273338] text-white border-b border-white/10">
            <div className="container max-w-6xl mx-auto px-4">
              <Link
                href={`/blog/${blogArticles[0].slug}`}
                className="group block p-8 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-[#9CB080] transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 aspect-[16/10] rounded-2xl overflow-hidden">
                    <img
                      src={blogArticles[0].image}
                      alt={blogArticles[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <div className="flex items-center gap-3 text-xs text-[#9CB080] font-semibold mb-3">
                      <span className="bg-[#9CB080]/15 px-3 py-1 rounded-full uppercase tracking-wider">
                        Featured Article
                      </span>
                      <span>•</span>
                      <span>{blogArticles[0].readTime}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-light text-white group-hover:text-[#9CB080] transition-colors leading-tight mb-4">
                      {blogArticles[0].title}
                    </h2>
                    <p className="text-sm text-white/70 leading-relaxed mb-6">
                      {blogArticles[0].excerpt}
                    </p>
                    <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-[#9CB080]">
                      <span>Read Full Article</span>
                      <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* Article Grid Section */}
        <section className="articles-grid-section py-20 bg-[#FBFBF9] text-[#273338]">
          <div className="container max-w-6xl mx-auto px-4">
            {filteredArticles.length === 0 ? (
              <p className="text-center text-sm text-[#414a4c]">No articles match your search criteria.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((art) => (
                  <Link
                    key={art.slug}
                    href={`/blog/${art.slug}`}
                    className="group bg-white rounded-3xl overflow-hidden border border-[#273338]/10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={art.image}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#2B5748] mb-2">
                          <span>{art.category}</span>
                          <span>•</span>
                          <span>{art.readTime}</span>
                        </div>
                        <h3 className="text-lg font-medium text-[#273338] group-hover:text-[#2B5748] transition-colors leading-snug mb-3">
                          {art.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#414a4c] leading-relaxed line-clamp-3">
                          {art.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 flex items-center justify-between text-xs text-[#2B5748] font-semibold border-t border-[#273338]/10 mt-4 pt-4">
                      <span>{art.date}</span>
                      <span className="inline-flex items-center group-hover:translate-x-1 transition-transform">
                        Read <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
