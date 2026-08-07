const NOTES = [
  'How benchmark sources become comparable',
  'Reading price context beside performance scores',
];

export default function FieldNotesPreview() {
  return (
    <section className="field-notes" aria-labelledby="field-notes-heading">
      <div><span className="section-kicker">Editorial index</span><h2 id="field-notes-heading">Field Notes</h2></div>
      <p>Short research explainers will appear here as the benchmark index grows.</p>
      <ul>{NOTES.map((note) => <li key={note}><span>{note}</span><em>Coming soon</em></li>)}</ul>
    </section>
  );
}
