const highlights = [
  { label: "Digital treatment planning", value: "3D" },
  { label: "Personalised patient care", value: "1:1" },
  { label: "Treatment pathways", value: "Clear" },
];

export function LuxuryStats() {
  return (
    <section className="number-panels" aria-label="Clinic care highlights">
      <div className="container">
        <div className="list">
          {highlights.map((item) => (
            <div className="item" key={item.label}>
              <p>{item.label}</p>
              <span className="h2 number">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
