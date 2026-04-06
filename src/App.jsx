import { useState, useMemo, useRef, useEffect } from "react";

const HISTORICAL_DATA = [
  { year: 2020, konsumsi: 33.5, produksi: 19.7, impor: 3.2, fame: 8.4 },
  { year: 2021, konsumsi: 33.4, produksi: 21.0, impor: 3.2, fame: 9.3 },
  { year: 2022, konsumsi: 36.2, produksi: 21.1, impor: 5.3, fame: 10.5 },
  { year: 2023, konsumsi: 37.8, produksi: 20.6, impor: 5.3, fame: 12.3 },
  { year: 2024, konsumsi: 39.2, produksi: 18.6, impor: 8.0, fame: 13.2 },
  { year: 2025, konsumsi: 39.5, produksi: 18.3, impor: 4.9, fame: 15.6 },
];

const REG_A = 32.41;
const REG_B = 3.82;
const RDMP_TAMBAHAN = 1.8;
const PRODUKSI_2025 = 18.3;
const KONSUMSI_2026 = REG_A + REG_B * Math.log(7);
const PRODUKSI_2026 = PRODUKSI_2025 + RDMP_TAMBAHAN;
const IMPOR_BASELINE = 4.9;
const SAWIT_YIELD_LOW = 3.3;
const SAWIT_YIELD_HIGH = 4.0;
const LAHAN_SAWIT_TOTAL = 16;

function fmt(val, d = 2) { return val.toFixed(d).replace(".", ","); }

function DataBar({ value, max, color, label }) {
  const pct = Math.min((Math.abs(value) / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3, color: "#94a3b8" }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{fmt(value)} jt kl</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 6, height: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step, unit, color, desc }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{label}</label>
        <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>
          {value.toLocaleString("id-ID")}{unit}
        </span>
      </div>
      {desc && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px 0" }}>{desc}</p>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569" }}>
        <span>{min.toLocaleString("id-ID")}{unit}</span>
        <span>{max.toLocaleString("id-ID")}{unit}</span>
      </div>
    </div>
  );
}

function Card({ title, value, unit, color, subtitle, icon }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      border: `1px solid ${color}33`, borderRadius: 14, padding: "18px 20px", flex: 1, minWidth: 150,
    }}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: "#94a3b8" }}> {unit}</span>
      </div>
      {subtitle && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}

// ========== COMBINED CHART — FIXED: no SVG text distortion ==========
function CombinedChart() {
  const chartH = 200;
  const maxVal = 44;
  const scale = chartH / maxVal;
  const allData = [...HISTORICAL_DATA, { year: 2026, konsumsi: KONSUMSI_2026, produksi: null, impor: null, fame: null, predicted: true }];
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(600);

  useEffect(() => {
    if (containerRef.current) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerW(entry.contentRect.width);
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }
  }, []);

  // Calculate center X for each bar column
  const gap = 6;
  const totalItems = allData.length;
  const itemWidth = (containerW - gap * (totalItems - 1)) / totalItems;

  const getBarCenterX = (i) => {
    return i * (itemWidth + gap) + itemWidth / 2;
  };

  const getBarTopY = (konsumsi) => {
    return chartH - konsumsi * scale;
  };

  // Build SVG path for line
  const historicalPoints = allData.slice(0, 6).map((d, i) => ({
    x: getBarCenterX(i),
    y: getBarTopY(d.konsumsi),
  }));
  const predPoint = {
    x: getBarCenterX(6),
    y: getBarTopY(allData[6].konsumsi),
  };

  const histPathD = historicalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const predPathD = `M${historicalPoints[5].x},${historicalPoints[5].y} L${predPoint.x},${predPoint.y}`;

  const allPoints = [...historicalPoints, predPoint];

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 16,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 6px 0", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
        📊 KOMPOSISI PASOKAN SOLAR INDONESIA
      </h3>
      <p style={{ fontSize: 12, color: "#475569", margin: "0 0 16px 0" }}>Dalam juta kiloliter • 2020–2026</p>

      <div ref={containerRef} style={{ position: "relative" }}>
        {/* Konsumsi labels — positioned as divs to avoid distortion */}
        {allData.map((d, i) => {
          const cx = getBarCenterX(i);
          const cy = getBarTopY(d.konsumsi);
          return (
            <div key={`label-${i}`} style={{
              position: "absolute",
              left: cx,
              top: cy - 28,
              transform: "translateX(-50%)",
              fontSize: 14,
              fontWeight: 800,
              color: d.predicted ? "#f59e0b" : "#fbbf24",
              fontFamily: "'Space Mono', monospace",
              zIndex: 10,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}>
              {fmt(d.konsumsi, 1)}
            </div>
          );
        })}

        {/* SVG overlay — only lines and dots, no text */}
        <svg style={{
          position: "absolute", top: 0, left: 0,
          width: containerW, height: chartH,
          pointerEvents: "none", zIndex: 5,
          overflow: "visible",
        }}>
          {/* Historical solid line */}
          <path d={histPathD} fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {/* Predicted dashed line */}
          <path d={predPathD} fill="none" stroke="#fbbf24" strokeWidth="3" strokeDasharray="8,6" strokeLinejoin="round" strokeLinecap="round" />
          {/* Dots */}
          {allPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === 6 ? 6 : 5}
              fill={i === 6 ? "#f59e0b" : "#fbbf24"} stroke="#0f172a" strokeWidth="2.5" />
          ))}
        </svg>

        {/* Bar columns */}
        <div style={{ display: "flex", gap, alignItems: "flex-end", height: chartH }}>
          {allData.map((d, i) => {
            if (d.predicted) {
              return (
                <div key={d.year} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
                  <div style={{
                    border: "2px dashed #475569", borderRadius: 8,
                    height: d.konsumsi * scale, width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#0f172a44",
                  }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Prediksi</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={d.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%" }}>
                  <div style={{ height: d.produksi * scale, background: "#1e3a5f", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{d.produksi}</span>
                  </div>
                  <div style={{ height: d.impor * scale, background: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "#0c4a6e", fontWeight: 700 }}>{d.impor}</span>
                  </div>
                  <div style={{ height: d.fame * scale, background: "#2dd4bf", borderRadius: "0 0 6px 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 10, color: "#064e3b", fontWeight: 700 }}>{d.fame}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Year labels */}
        <div style={{ display: "flex", gap, marginTop: 8 }}>
          {allData.map((d) => (
            <div key={d.year} style={{
              flex: 1, textAlign: "center",
              fontSize: 12, fontWeight: d.predicted ? 700 : 600,
              color: d.predicted ? "#f59e0b" : "#64748b",
            }}>
              {d.year}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          { color: "#1e3a5f", label: "Produksi" },
          { color: "#38bdf8", label: "Impor" },
          { color: "#2dd4bf", label: "FAME" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
            <div style={{ width: 12, height: 12, background: l.color, borderRadius: 3 }} />
            {l.label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
          <div style={{ width: 18, height: 3, background: "#fbbf24", borderRadius: 2 }} />
          Konsumsi Total
        </div>
      </div>
    </div>
  );
}

function Methodology() {
  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "14px 18px", marginBottom: 24 }}>
      <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.7 }}>
        <strong style={{ color: "#64748b" }}>Metodologi:</strong> Konsumsi 2026 diprediksi via regresi logaritmik (y = {REG_A} + {REG_B}·ln(x), x=7) karena tren pertumbuhan yang semakin landai. Produksi 2026 naik +{RDMP_TAMBAHAN} jt kl dari RDMP Balikpapan. Konversi CPO: 1.086 liter biodiesel per kg CPO (sumber: Kemenperin/ERIA). Yield sawit: {SAWIT_YIELD_LOW}–{SAWIT_YIELD_HIGH} ton/ha/tahun (GAPKI). Total lahan sawit Indonesia: {LAHAN_SAWIT_TOTAL} jt ha (2024). Analisis fiskal bersifat marginal: menghitung penghematan dari impor yang diganti FAME dikurangi biaya insentif untuk volume pengganti.
      </p>
    </div>
  );
}

export default function SolarDashboard() {
  const [famePct, setFamePct] = useState(50);
  const [subsidiPerLiter, setSubsidiPerLiter] = useState(5150);
  const [biayaFameGov, setBiayaFameGov] = useState(3000);

  const R = useMemo(() => {
    const konsumsi = KONSUMSI_2026;
    const produksi = PRODUKSI_2026;
    const fameRatio = famePct / 100;
    const kebutuhanFame = konsumsi * fameRatio;
    const kebutuhanSolarFosil = konsumsi * (1 - fameRatio);
    const selisih = produksi - kebutuhanSolarFosil;
    const swasembada = selisih >= 0;
    const imporDibutuhkan = swasembada ? 0 : Math.abs(selisih);

    const cpoJtTon = kebutuhanFame * 1000 / 1086;
    const lahanLow = cpoJtTon / SAWIT_YIELD_HIGH;
    const lahanHigh = cpoJtTon / SAWIT_YIELD_LOW;
    const lahanPctHigh = (lahanHigh / LAHAN_SAWIT_TOTAL) * 100;

    // Marginal fiscal: only on imports replaced
    const imporDihindari = swasembada
      ? IMPOR_BASELINE
      : Math.max(0, IMPOR_BASELINE - imporDibutuhkan);
    const penghematanSubsidi = imporDihindari * subsidiPerLiter / 1000;
    const biayaFame = imporDihindari * biayaFameGov / 1000;
    const bersih = penghematanSubsidi - biayaFame;

    return {
      konsumsi, produksi, kebutuhanFame, kebutuhanSolarFosil,
      selisih, swasembada, imporDibutuhkan, imporDihindari,
      cpoJtTon, lahanLow, lahanHigh, lahanPctHigh,
      penghematanSubsidi, biayaFame, bersih,
    };
  }, [famePct, subsidiPerLiter, biayaFameGov]);

  const blend = `B${famePct}`;

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(135deg, #0c4a6e 0%, #064e3b 50%, #0f172a 100%)",
        padding: "28px 24px 22px", borderBottom: "1px solid #164e63",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 26 }}>⛽</span>
            <h1 style={{
              fontSize: 20, fontWeight: 800, margin: 0,
              background: "linear-gradient(90deg, #22d3ee, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Space Mono', monospace",
            }}>KALKULATOR SWASEMBADA SOLAR</h1>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Simulasi skenario biodiesel Indonesia 2026</p>
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#67e8f9", background: "#0c4a6e55", padding: "4px 10px", borderRadius: 20 }}>
              📈 Konsumsi 2026: {fmt(KONSUMSI_2026)} jt kl
            </span>
            <span style={{ fontSize: 12, color: "#6ee7b7", background: "#064e3b55", padding: "4px 10px", borderRadius: 20 }}>
              🏭 Produksi 2026: {fmt(PRODUKSI_2026)} jt kl
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        <CombinedChart />
        <Methodology />

        {/* INPUT */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 20px 0", letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>
            ⚙️ VARIABEL INPUT
          </h2>
          <Slider label={`Persentase FAME (${blend})`} value={famePct} onChange={setFamePct}
            min={20} max={100} step={5} unit="%" color="#22d3ee"
            desc="Rasio FAME dalam campuran solar. B40 = 40%, B50 = 50%" />
          <Slider label="Subsidi Solar Impor" value={subsidiPerLiter} onChange={setSubsidiPerLiter}
            min={1000} max={10000} step={100} unit=" Rp/l" color="#f59e0b"
            desc="Subsidi per liter solar impor yang ditanggung APBN (harga keekonomian − harga jual)" />
          <Slider label="Biaya FAME ditanggung Pemerintah" value={biayaFameGov} onChange={setBiayaFameGov}
            min={500} max={8000} step={100} unit=" Rp/l" color="#f472b6"
            desc="Insentif per liter FAME yang dibayar pemerintah via BPDPKS ke produsen biodiesel" />
        </div>

        {/* STATUS */}
        <div style={{
          background: R.swasembada
            ? "linear-gradient(135deg, #064e3b 0%, #0f766e 100%)"
            : "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
          border: `1px solid ${R.swasembada ? "#34d399" : "#f87171"}44`,
          borderRadius: 14, padding: "18px 24px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 36 }}>{R.swasembada ? "✅" : "❌"}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: R.swasembada ? "#6ee7b7" : "#fca5a5", fontFamily: "'Space Mono', monospace" }}>
              {R.swasembada ? `SWASEMBADA TERCAPAI (${blend})` : `BELUM SWASEMBADA (${blend})`}
            </div>
            <div style={{ fontSize: 13, color: R.swasembada ? "#a7f3d0" : "#fecaca", marginTop: 2 }}>
              {R.swasembada
                ? `Surplus solar fosil: ${fmt(R.selisih)} jt kl`
                : `Masih perlu impor: ${fmt(R.imporDibutuhkan)} jt kl`}
            </div>
          </div>
        </div>

        {/* KEY RESULTS */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <Card title="Kebutuhan FAME" value={fmt(R.kebutuhanFame)} unit="jt kl" color="#22d3ee"
            subtitle={`${famePct}% × ${fmt(R.konsumsi)} jt kl`} icon="🌿" />
          <Card title="Kebutuhan Solar Fosil" value={fmt(R.kebutuhanSolarFosil)} unit="jt kl" color="#f59e0b"
            subtitle={`${100 - famePct}% × ${fmt(R.konsumsi)} jt kl`} icon="🛢️" />
          <Card title="Penghematan Bersih" value={fmt(R.bersih)} unit="Triliun" color={R.bersih >= 0 ? "#34d399" : "#f87171"}
            subtitle={`Impor diganti: ${fmt(R.imporDihindari)} jt kl`} icon="💰" />
        </div>

        {/* NERACA */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 16px 0", fontFamily: "'Space Mono', monospace" }}>
            🛢️ NERACA SOLAR FOSIL 2026
          </h3>
          <DataBar value={R.produksi} max={40} color="#34d399" label="Produksi domestik (+ RDMP)" />
          <DataBar value={R.kebutuhanSolarFosil} max={40} color="#f59e0b" label={`Kebutuhan solar fosil (${100 - famePct}%)`} />
          <DataBar value={Math.abs(R.selisih)} max={40}
            color={R.swasembada ? "#22d3ee" : "#f87171"}
            label={R.swasembada ? "✅ Surplus" : "❌ Defisit (perlu impor)"} />
        </div>

        {/* LAHAN SAWIT */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 16px 0", fontFamily: "'Space Mono', monospace" }}>
            🌴 KEBUTUHAN LAHAN SAWIT
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>CPO dibutuhkan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", fontFamily: "'Space Mono', monospace" }}>
                {fmt(R.cpoJtTon)} <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>jt ton</span>
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                {fmt(R.kebutuhanFame)} jt kl × 1000 ÷ 1086
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Lahan sawit dibutuhkan</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#22d3ee", fontFamily: "'Space Mono', monospace" }}>
                {fmt(R.lahanLow)} – {fmt(R.lahanHigh)} <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>jt ha</span>
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                Yield: {SAWIT_YIELD_LOW}–{SAWIT_YIELD_HIGH} ton/ha/thn
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            Proporsi dari total lahan sawit ({LAHAN_SAWIT_TOTAL} jt ha):
          </div>
          <div style={{ background: "#1e293b", borderRadius: 8, height: 16, overflow: "hidden", border: "1px solid #334155" }}>
            <div style={{
              width: `${Math.min(R.lahanPctHigh, 100)}%`,
              background: R.lahanPctHigh > 100
                ? "linear-gradient(90deg, #f87171, #dc2626)"
                : "linear-gradient(90deg, #22d3ee, #06b6d4)",
              height: "100%", borderRadius: 8, transition: "width 0.4s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{fmt(R.lahanPctHigh, 1)}%</span>
            </div>
          </div>
          {R.lahanPctHigh > 100 && (
            <div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>⚠️ Melebihi lahan tersedia!</div>
          )}
        </div>

        {/* FISKAL */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid #334155", borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", margin: "0 0 16px 0", fontFamily: "'Space Mono', monospace" }}>
            💰 ANALISIS FISKAL
          </h3>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>
            Perhitungan marginal: penghematan dari impor yang diganti FAME ({fmt(R.imporDihindari)} jt kl dari baseline {IMPOR_BASELINE} jt kl)
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#064e3b44", borderRadius: 10, border: "1px solid #34d39933", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: "#6ee7b7", fontWeight: 600 }}>Penghematan Subsidi Impor</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(R.imporDihindari)} jt kl × Rp{subsidiPerLiter.toLocaleString("id-ID")}/l</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", fontFamily: "'Space Mono', monospace" }}>+{fmt(R.penghematanSubsidi)} T</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#7f1d1d33", borderRadius: 10, border: "1px solid #f8717133", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 600 }}>Biaya Insentif FAME (BPDPKS)</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>{fmt(R.imporDihindari)} jt kl × Rp{biayaFameGov.toLocaleString("id-ID")}/l</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#f87171", fontFamily: "'Space Mono', monospace" }}>-{fmt(R.biayaFame)} T</div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px",
            background: R.bersih >= 0
              ? "linear-gradient(135deg, #064e3b, #0f766e)"
              : "linear-gradient(135deg, #7f1d1d, #991b1b)",
            borderRadius: 10, border: `2px solid ${R.bersih >= 0 ? "#34d399" : "#f87171"}`,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>PENGHEMATAN BERSIH</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: R.bersih >= 0 ? "#6ee7b7" : "#fca5a5", fontFamily: "'Space Mono', monospace" }}>
              {R.bersih >= 0 ? "+" : ""}{fmt(R.bersih)} T
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: "center", padding: "24px 0 40px" }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>💡</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", fontFamily: "'Space Mono', monospace", letterSpacing: 1 }}>
            Semua Bisa Dihitung
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            by Alif Towew
          </div>
        </div>
      </div>
    </div>
  );
}
