function number(value) {
  return Number.isFinite(value) ? new Intl.NumberFormat('en-US').format(value) : 'Not available';
}

function price(value) {
  return Number.isFinite(value) ? `₹${new Intl.NumberFormat('en-US').format(value)}` : 'Not available';
}

function label(value) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : 'Not available';
}

export default function DeviceSnapshotTable({ rows = [], loading = false, error = null }) {
  if (loading) return <section className="snapshot-panel" role="status">Loading current device data</section>;
  if (error) return <section className="snapshot-panel snapshot-error" role="alert">{error}</section>;

  return (
    <section className="snapshot-panel" aria-labelledby="device-snapshot-heading">
      <div className="snapshot-heading">
        <div><span className="section-kicker">Available dataset</span><h2 id="device-snapshot-heading">Device snapshot</h2></div>
        <p>{rows.length} device records from the current local dataset</p>
      </div>
      {rows.length === 0 ? <p>No device records are available yet.</p> : (
        <div className="snapshot-scroll">
          <table aria-label="Current device data">
            <thead><tr><th>Phone</th><th className="hide-on-mobile">Processor</th><th>AnTuTu score</th><th className="hide-on-mobile">Normalized INR price</th><th className="hide-on-mobile">Price type</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id}><td>{row.phoneName}</td><td className="hide-on-mobile">{row.processorName}</td><td>{number(row.antutuScore)}</td><td className="hide-on-mobile">{price(row.plottedPrice?.normalizedINR)}</td><td className="hide-on-mobile">{label(row.plottedPrice?.priceType)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
