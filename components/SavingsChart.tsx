"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { ACCENT_COLOR } from "@/lib/ui/tiers";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Legend, Tooltip);

const GRID_COLOR = "rgba(255,255,255,0.08)";
const TICK_COLOR = "rgba(255,255,255,0.5)";
const MONO_FONT = { family: "var(--font-geist-mono)", size: 11 };

interface SavingsChartProps {
  labels: string[];
  data: number[];
}

export default function SavingsChart({ labels, data }: SavingsChartProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            data,
            borderColor: ACCENT_COLOR,
            backgroundColor: ACCENT_COLOR,
            pointBackgroundColor: ACCENT_COLOR,
            pointStyle: "rect",
            pointRadius: 3,
            borderWidth: 2,
            fill: false,
            tension: 0,
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: GRID_COLOR },
            border: { color: GRID_COLOR },
            ticks: { color: TICK_COLOR, font: MONO_FONT },
          },
          y: {
            beginAtZero: true,
            grid: { color: GRID_COLOR },
            border: { display: false },
            ticks: { color: TICK_COLOR, font: MONO_FONT },
          },
        },
      }}
    />
  );
}
