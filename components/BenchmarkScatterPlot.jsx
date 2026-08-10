'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Chart } from '@tanstack/react-charts';
import * as chartDefinition from '@/lib/benchmarkChartDefinition';

export const CHART_FALLBACK_HEIGHT = 384;

function useResponsiveChartHeight() {
  const canvasRef = useRef(null);
  const [height, setHeight] = useState(CHART_FALLBACK_HEIGHT);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return undefined;

    const updateHeight = () => {
      const measuredHeight = canvas.clientHeight || Math.max(0, Math.round(canvas.getBoundingClientRect().height) - 2);
      if (measuredHeight > 0) setHeight(measuredHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return { canvasRef, height };
}

export default function BenchmarkScatterPlot({ metric, theme = 'dark' }) {
  const { canvasRef, height } = useResponsiveChartHeight();
  const chartInputKey = chartDefinition.benchmarkChartInputKey(metric, theme);
  const definition = useMemo(
    () => chartDefinition.createBenchmarkChartDefinition({ metric, theme }),
    // The semantic key intentionally replaces object identity for equivalent metric objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartInputKey],
  );
  const chartLabel = metric.chartLabel || metric.label;
  const pointLabel = `${metric.points.length} benchmark point${metric.points.length === 1 ? '' : 's'}`;
  const chartDescription = `${metric.label || chartLabel} plotted against price in INR. ${pointLabel} are shown. Lines connect sibling variants within the same generation; they are not trend or regression lines. Focus or hover a point for its score, price, and metric-specific details.`;

  const emptyLabel = metric.label.startsWith('3DMark') ? '3DMark' : metric.label;
  if (!metric.points.length) return <section className="graph-empty-state" role="status" aria-live="polite" aria-label="Benchmark availability">{emptyLabel} data is not available yet.</section>;

  return <figure className="benchmark-graph shrink-safe" aria-label={`${chartLabel} price versus performance chart`}>
    <figcaption>{chartDescription}</figcaption>
    <div ref={canvasRef} className="benchmark-canvas" data-chart-theme={theme}>
      <Chart
        definition={definition}
        height={height}
        ariaLabel={`${chartLabel} price versus performance chart`}
        ariaDescription={chartDescription}
      />
    </div>
  </figure>;
}
