"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard#cv-upload", label: "Analyze" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/dashboard#analysis-history", label: "History" },
];

export function Navbar() {
  return (
    <header className="navbar">
      <nav className="nav-inner" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="ResumeIQ home"><span className="brand-symbol" aria-hidden="true">R</span><span>ResumeIQ</span></Link>

        <div className="nav-links">
          {links.map((link) => (
            <a key={link.label} href={link.href}>{link.label}</a>
          ))}
          <a className="nav-signin" href="/login">Sign in</a>
          <a className="nav-cta" href="/dashboard#cv-upload">Start an analysis <ArrowUpRight size={13} aria-hidden="true" /></a>
        </div>

        <details className="mobile-menu">
          <summary aria-label="Toggle navigation menu">
            <Menu className="menu" size={19} aria-hidden="true" />
            <X className="close" size={19} aria-hidden="true" />
          </summary>

          <div
            className="mobile-panel"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                event.currentTarget
                  .closest("details")
                  ?.removeAttribute("open");
              }
            }}
          >
            {links.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
            <a href="/login">Sign in</a>
            <a className="mobile-cta" href="/dashboard#cv-upload">Start an analysis <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
        </details>
      </nav>
    </header>
  );
}