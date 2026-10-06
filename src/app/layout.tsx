import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeIQ | Make your next move with confidence",
  description: "Understand what your resume is saying with a clear score, practical strengths, and specific recommendations to improve your CV.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <div className="site-frame">{children}</div>
      </body>
    </html>
  );
}
