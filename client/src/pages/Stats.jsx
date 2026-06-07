import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';

const STATUS_COLOR = {
  '읽는 중': '#B8713A',
  '완독': '#4F8A4F',
  '읽고 싶음': '#4D88AA',
};
const STATUS_ORDER = ['읽는 중', '완독', '읽고 싶음'];
const GENRE_COLORS = ['#9B84C8', '#B8713A', '#4D88AA', '#4F8A4F', '#C4A028', '#B85080', '#60A4A0', '#8870C0'];

// ── Donut chart ──────────────────────────────────────────────────────────────
const CX = 80, CY = 80, OUTER_R = 66, INNER_R = 42, GAP = 2;

function pToXY(r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arcPath(startDeg, endDeg) {
  const [sx, sy] = pToXY(OUTER_R, startDeg);
  const [ex, ey] = pToXY(OUTER_R, endDeg);
  const [iex, iey] = pToXY(INNER_R, endDeg);
  const [isx, isy] = pToXY(INNER_R, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${sx},${sy} A${OUTER_R},${OUTER_R},0,${large},1,${ex},${ey} L${iex},${iey} A${INNER_R},${INNER_R},0,${large},0,${isx},${isy}Z`;
}

function DonutChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  let deg = 0;
  const segs = data.map((d, i) => {
    const span = (d.count / total) * 360;
    const start = deg + GAP / 2;
    const end = deg + span - GAP / 2;
    deg += span;
    return { ...d, start, end, color: GENRE_COLORS[i % GENRE_COLORS.length] };
  });

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" width={140} height={140} style={{ display: 'block', margin: '0 auto' }}>
        {segs.map((s, i) => (
          <path key={i} d={arcPath(s.start, s.end)} fill={s.color} />
        ))}
        <text x={80} y={77} textAnchor="middle" fontSize={20} fontFamily="var(--font-serif)" fill="var(--text)">{total}</text>
        <text x={80} y={94} textAnchor="middle" fontSize={10} fill="var(--text-muted)">권 완독</text>
      </svg>
      <div className="donut-legend">
        {segs.map((s) => (
          <div key={s.genre} className="donut-legend-row">
            <span className="donut-legend-dot" style={{ background: s.color }} />
            <span className="donut-legend-name">{s.genre}</span>
            <span className="donut-legend-pct">{Math.round((s.count / total) * 100)}%</span>
            <span className="donut-legend-count">{s.count}권</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly bar chart ─────────────────────────────────────────────────────────
function MonthlyChart({ monthlyCounts, years }) {
  const [year, setYear] = useState(years[0] ?? '');
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    const found = monthlyCounts.find((d) => d.year === year && d.month === m);
    return { idx: i + 1, count: found?.count ?? 0 };
  });
  const max = Math.max(...months.map((m) => m.count), 1);

  return (
    <>
      <div className="chart-year-tabs">
        {years.map((y) => (
          <button
            key={y}
            className={`filter-btn${year === y ? ' active' : ''}`}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>
      <div className="monthly-chart">
        {months.map(({ idx, count }) => {
          const barH = count > 0 ? Math.max((count / max) * 84, 4) : 0;
          return (
            <div key={idx} className="monthly-bar-col">
              <div className="monthly-bar-track">
                <div className="monthly-bar-fill" style={{ height: `${barH}px` }}>
                  {count > 0 && <span className="monthly-bar-count">{count}</span>}
                </div>
              </div>
              <div className="monthly-bar-label">{idx}월</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Stats page ────────────────────────────────────────────────────────────────
export default function Stats() {
  const { data: stats, isPending } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  });

  if (isPending) return <div className="loading-wrap"><span className="spinner" /></div>;
  if (!stats) return null;

  const completedCount = stats.statusCounts.find((s) => s.status === '완독')?.count ?? 0;
  const statusTotal = stats.statusCounts.reduce((acc, s) => acc + s.count, 0);
  const maxYearly = stats.yearlyCompleted.length
    ? Math.max(...stats.yearlyCompleted.map((y) => y.count))
    : 1;
  const years = [...new Set(stats.monthlyCounts.map((d) => d.year))].sort((a, b) => b - a);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">통계</h1>
      </div>

      <div className="stats-grid">
        {[
          { value: stats.totalBooks, label: '등록한 책' },
          { value: completedCount, label: '완독한 책' },
          { value: stats.avgRating ?? '—', label: '평균 별점' },
          { value: stats.totalQuotes, label: '수집한 문장' },
        ].map(({ value, label }) => (
          <div key={label} className="stat-card">
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {stats.yearlyCompleted.length > 0 && (
        <>
          <div className="section-title">연도별 완독</div>
          <div className="yearly-list">
            {stats.yearlyCompleted.map((y) => (
              <div key={y.year} className="yearly-row">
                <span className="yearly-year">{y.year}</span>
                <div className="yearly-bar-bg">
                  <div className="yearly-bar" style={{ width: `${(y.count / maxYearly) * 100}%` }} />
                </div>
                <span className="yearly-count">{y.count}권</span>
              </div>
            ))}
          </div>
        </>
      )}

      {years.length > 0 && (
        <>
          <div className="section-title">월별 완독</div>
          <div className="monthly-chart-card">
            <MonthlyChart monthlyCounts={stats.monthlyCounts} years={years} />
          </div>
        </>
      )}

      <div className="stats-two-col">
        {stats.statusCounts.length > 0 && (
          <div>
            <div className="section-title">상태별 현황</div>
            <div className="status-dist">
              {[...stats.statusCounts]
                .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
                .map((s) => {
                  const pct = statusTotal > 0 ? (s.count / statusTotal) * 100 : 0;
                  const color = STATUS_COLOR[s.status] ?? '#888';
                  return (
                    <div key={s.status} className="status-dist-row">
                      <span className="status-dist-label" style={{ color }}>{s.status}</span>
                      <div className="status-dist-bar-bg">
                        <div className="status-dist-bar" style={{ width: `${pct}%`, background: color, opacity: 0.65 }} />
                      </div>
                      <span className="status-dist-count">{s.count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div>
          <div className="section-title">분야별 권수</div>
          <div className="donut-card">
            {stats.genreCounts.length > 0 ? (
              <DonutChart data={stats.genreCounts} />
            ) : (
              <div className="donut-empty">
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem', opacity: 0.4 }}>◎</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  완독한 책에 분야를 입력하면<br />여기에 표시됩니다
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
