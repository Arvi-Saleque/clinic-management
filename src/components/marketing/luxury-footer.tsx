"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, ArrowRight, CalendarDays } from "lucide-react";

interface BranchInfo {
  id?: string;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  timezone?: string | null;
}

interface LuxuryFooterProps {
  branch?: BranchInfo | null;
  treatments?: { href: string; label: string }[];
}

export function LuxuryFooter({
  branch,
  treatments: _treatments = [],
}: LuxuryFooterProps) {
  const phoneDisplay = branch?.phone || "+44 (020) 7946 0000";
  const phoneClean = phoneDisplay.replace(/\s+/g, "");
  const addressDisplay = branch?.address || "74 Harley Street, Marylebone, London W1G 7HQ";

  return (
    <footer id="footer" className="luxury-site-footer">
      <div className="container">
        {/* Brand & Direct Contact Highlight Banner (No Fake Newsletter Form) */}
        <div className="footer-top-banner">
          <div className="footer-brand-info">
            <Link href="/" className="footer-logo">
              <span className="logo-text">
                CLINIC CARE <i>DENTAL</i>
              </span>
            </Link>
            <p className="footer-tagline">
              Thoughtful cosmetic, restorative, and general dental care with clear treatment planning and a comfort-focused patient experience.
            </p>
          </div>

          <div className="footer-newsletter">
            <h4 className="text-white text-lg font-medium">Ready to Discuss Your Smile?</h4>
            <p className="text-white/70 text-sm mt-1 mb-4">
              Book a consultation online or contact the clinic team if you would like help choosing the right next step.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book" className="btn-blue text-xs uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                Book Online
              </Link>
              <Link href="/contact" className="btn-stroke text-xs uppercase tracking-wider border-white/20 hover:border-white text-white">
                Contact Clinic
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Column Footer Navigation Grid */}
        <div className="grid">
          {/* Col 1: Treatments */}
          <div className="col">
            <h4>Cosmetic &amp; Clinical</h4>
            <ul>
              <li>
                <Link href="/services">Porcelain Veneers</Link>
              </li>
              <li>
                <Link href="/services">All-On Implants™</Link>
              </li>
              <li>
                <Link href="/services">Invisalign® Clear Aligners</Link>
              </li>
              <li>
                <Link href="/services">Laser Teeth Whitening</Link>
              </li>
              <li>
                <Link href="/services">All Treatments &amp; Services</Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Practice & Showcase */}
          <div className="col">
            <h4>Practice &amp; Showcase</h4>
            <ul>
              <li>
                <Link href="/about">About Our Clinic</Link>
              </li>
              <li>
                <Link href="/practitioners">Our Dental Practitioners</Link>
              </li>
              <li>
                <Link href="/results">Smile Results &amp; Gallery</Link>
              </li>
              <li>
                <Link href="/contact">Contact &amp; Clinic Hours</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Clinic Location */}
          <div className="col">
            <h4>Clinic Contact</h4>
            <ul>
              <li className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                <MapPin className="w-3.5 h-3.5 text-[#9CB080] shrink-0 mt-0.5" />
                <span>{addressDisplay}</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <Phone className="w-3.5 h-3.5 text-[#9CB080] shrink-0" />
                <a href={`tel:${phoneClean}`}>{phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2 text-xs text-white/70">
                <Mail className="w-3.5 h-3.5 text-[#9CB080] shrink-0" />
                <a href="mailto:concierge@cliniccare.test">concierge@cliniccare.test</a>
              </li>
              <li>
                <span className="emergency-badge">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  Contact us for urgent dental enquiries
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Appointments & Access */}
          <div className="col">
            <h4>Appointments &amp; Access</h4>
            <ul>
              <li>
                <Link href="/book" className="font-bold text-[#9CB080]">
                  Book Online →
                </Link>
              </li>
              <li>
                <Link href="/login">Patient Portal Login</Link>
              </li>
              <li>
                <Link href="/contact">Send General Inquiry</Link>
              </li>
              <li>
                <Link href="/contact">Patient Support</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="bottom">
          <p>
            &copy; {new Date().getFullYear()} Clinic Care Dental. All rights reserved.
          </p>
          <div className="links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Preferences</Link>
            <Link href="/contact">Patient Care Charter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
