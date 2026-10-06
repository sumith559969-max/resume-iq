import { ArrowRight, BarChart3, BookOpenCheck, Clock3, FileCheck2, Focus, History, LockKeyhole, ScanSearch, ShieldCheck, Target } from "lucide-react";

const steps = [
  { number: "01", title: "Upload your CV", body: "Drop in the PDF you already use. Your review begins with the experience that makes your story yours." },
  { number: "02", title: "Let AI read it", body: "ResumeIQ evaluates structure, skills, experience, education, ATS readiness, and the story your CV tells." },
  { number: "03", title: "Know what to improve", body: "See your strengths, gaps, and the next edits most likely to make a difference." },
];
const features = [
  { icon: BarChart3, title: "Resume score", body: "A clear overall assessment, supported by the signals that shape a compelling CV." },
  { icon: ScanSearch, title: "ATS intelligence", body: "Understand how structure, readability, and formatting support screening systems." },
  { icon: Focus, title: "Skills analysis", body: "See the strengths in your stated skills and where the evidence could be clearer." },
  { icon: Target, title: "Job matching", body: "Compare your CV with an actual role description and see relevant evidence and gaps." },
  { icon: History, title: "Analysis history", body: "Return to your saved reviews as your experience and resume evolve." },
  { icon: FileCheck2, title: "Professional report", body: "Download a considered summary of your scores, findings, and next steps." },
];
const points = [
  { icon: Clock3, title: "Feedback without the wait", body: "Get a focused first review when you are ready to make a change." },
  { icon: Target, title: "A clearer place to start", body: "Turn a long list of possible edits into a few useful priorities." },
  { icon: BookOpenCheck, title: "Consistent review criteria", body: "Look at the same core resume signals each time you refine your CV." },
  { icon: LockKeyhole, title: "Your history, kept personal", body: "A private place to return to your own resume analyses and progress." },
];
const Kicker = ({ children }: { children: React.ReactNode }) => <p className="kicker">{children}</p>;

export function HowItWorks() { return <section className="section process-section" id="how-it-works" aria-labelledby="steps-title"><div className="content"><div className="section-intro"><Kicker>A clearer process</Kicker><h2 className="heading" id="steps-title">A considered review.<br />A more useful next step.</h2><p className="intro">Three deliberate steps from the CV you have to the changes worth making.</p></div><div className="steps-grid">{steps.map(step => <article className="step" key={step.number}><span className="step-number">{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></article>)}</div></div></section>; }

export function Features() { return <section className="features-section" id="features" aria-labelledby="features-title"><div className="content"><div className="features-header"><div><Kicker>A better read on your CV</Kicker><h2 className="heading" id="features-title">The detail behind<br />the score.</h2></div><p className="intro">A practical assessment makes the next edit clearer, more focused, and more your own.</p></div><div className="features-grid">{features.map(({ icon: Icon, title, body }, index) => <article className="feature-card" key={title}><span className="feature-index">0{index + 1}</span><span className="feature-icon"><Icon size={17} strokeWidth={1.65} aria-hidden="true" /></span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></div></section>; }

export function ValueSection() { return <section className="value-section" aria-labelledby="value-title"><div className="content value-layout"><div><Kicker>Make every edit more deliberate</Kicker><h2 className="heading" id="value-title">Less second-guessing.<br />More direction.</h2><p className="intro">A resume is a moving picture of your experience. ResumeIQ gives you a consistent, practical way to see it more clearly.</p></div><div className="value-list">{points.map(({ icon: Icon, title, body }) => <article className="value-point" key={title}><span className="value-icon"><Icon size={14} strokeWidth={1.8} aria-hidden="true" /></span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></div></section>; }

export function FinalCta() { return <section className="cta-section" id="get-started" aria-labelledby="cta-title"><div className="content cta-inner"><div><Kicker>Your next step starts here</Kicker><h2 className="heading" id="cta-title">Know what your resume is saying.</h2><p className="intro">Turn your CV into clear, actionable feedback, and decide what to improve with confidence.</p></div><div className="cta-action"><a className="button dark-button" href="/dashboard#cv-upload">Analyse my CV <ArrowRight size={15} aria-hidden="true" /></a><span className="cta-note"><ShieldCheck size={12} aria-hidden="true" /> Private to your account</span></div></div></section>; }