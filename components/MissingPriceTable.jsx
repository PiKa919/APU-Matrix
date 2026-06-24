'use client';

export default function MissingPriceTable({ rows = [] }) {
  const missingRows = rows.filter((row) => !row.plottedPrice);

  if (missingRows.length === 0) {
    return null;
  }

  return (
    <section className="border border-border/60 bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Missing price review</h2>
          <p className="text-xs text-muted-foreground">{missingRows.length} phones need launch or current price evidence</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-semibold">Phone</th>
              <th className="py-2 pr-4 font-semibold">Processor</th>
              <th className="py-2 pr-4 font-semibold">Score</th>
              <th className="py-2 pr-4 font-semibold">Category</th>
              <th className="py-2 pr-4 font-semibold">Missing</th>
            </tr>
          </thead>
          <tbody>
            {missingRows.map((row) => (
              <tr key={row.id} className="border-b border-border/30 last:border-0">
                <td className="py-2 pr-4 font-medium text-foreground">{row.phoneName}</td>
                <td className="py-2 pr-4 text-muted-foreground">{row.processorName}</td>
                <td className="py-2 pr-4 font-mono text-muted-foreground">{row.antutuScore.toLocaleString()}</td>
                <td className="py-2 pr-4 text-muted-foreground">{row.category}</td>
                <td className="py-2 pr-4 text-muted-foreground">{row.missingFields.join(', ') || 'price'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
