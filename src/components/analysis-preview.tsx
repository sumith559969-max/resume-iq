export function AnalysisPreview() {
  return (
    <aside className="analysis-preview" aria-label="Illustration of a sample ResumeIQ CV review">
      <div className="art-orbit art-orbit-one" aria-hidden="true" />
      <div className="art-orbit art-orbit-two" aria-hidden="true" />
      <div className="resume-sheet">
        <div className="resume-sheet-head"><span className="resume-monogram">S</span><div><i className="resume-line resume-name" /><i className="resume-line resume-role" /></div><span className="resume-sheet-index">CV / 01</span></div>
        <div className="resume-contact"><i /><i /><i /></div>
        <div className="resume-section-label">EXPERIENCE</div>
        <div className="resume-entry"><span className="resume-date">2022 — 2025</span><i className="resume-line resume-entry-title" /><i className="resume-line resume-entry-copy long" /><i className="resume-line resume-entry-copy" /><i className="resume-line resume-entry-copy medium" /></div>
        <div className="resume-entry"><span className="resume-date">2019 — 2022</span><i className="resume-line resume-entry-title short" /><i className="resume-line resume-entry-copy medium" /><i className="resume-line resume-entry-copy long" /></div>
        <div className="resume-highlight"><span>REVIEW NOTE</span><i className="resume-line highlight-line" /><i className="resume-line highlight-line short" /></div>
        <div className="resume-section-label">SELECTED SKILLS</div>
        <div className="resume-skills"><i /><i /><i /><i /></div>
      </div>
      <div className="analysis-signal signal-score"><span>01 / SIGNAL</span><strong>Experience</strong><i><b /></i></div>
      <div className="analysis-signal signal-fit"><span>02 / READABILITY</span><strong>Clear structure</strong><i><b /></i></div>
      <div className="art-caption"><span>01</span><span>A more considered read on your experience</span><span className="sample-badge">SAMPLE VIEW</span></div>
    </aside>
  );
}