import { AnalysisPreview } from "@/components/analysis-preview";
import { Footer } from "@/components/footer";
import { Features, FinalCta, HowItWorks, ValueSection } from "@/components/landing-sections";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <div className="hero-shell" id="top">
          <section className="hero wrap" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><i /> AI-powered resume intelligence</p>
              <h1 id="hero-title">YOUR RESUME<br />DESERVES A<br /><span>SECOND OPINION.</span></h1>
              <div className="hero-lower">
                <div className="hero-description-block">
                  <p className="hero-description">A considered read on your experience. See what stands out, where the story loses focus, and what to improve next.</p>
                  <div className="hero-actions">
                    <a className="button primary" href="/dashboard#cv-upload">Analyse my CV <span aria-hidden="true">↗</span></a>
                    <a className="button secondary" href="#how-it-works">How it works <span aria-hidden="true">↓</span></a>
                  </div>
                </div>
                <p className="assurance"><span aria-hidden="true">✓</span> Specific feedback. Grounded in your CV.</p>
              </div>
            </div>
            <AnalysisPreview />
          </section>
          <div className="hero-note wrap"><span>RESUMEIQ / 01</span><span>Clarity for the next step in your career</span></div>
        </div>
        <HowItWorks />
        <Features />
        <ValueSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}