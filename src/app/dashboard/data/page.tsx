"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardDataItem {
  id: string;
  category: string;
  year: number;
  data: any;
  importedAt: string;
}

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024];

const chartColors = [
  "#1F4E79",
  "#2E75B6",
  "#0D9488",
  "#059669",
  "#D97706",
  "#DC2626",
  "#8B5CF6",
];

export default function DataPage() {
  const [data, setData] = useState<DashboardDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      try {
        const url =
          yearFilter === "all"
            ? "/api/dashboard/data"
            : `/api/dashboard/data?year=${yearFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const items = await res.json();
          setData(items);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [yearFilter]);

  // Find data by category
  const functieniveauData = data.find((d) => d.category === "gender_per_functieniveau");
  const afdelingData = data.find((d) => d.category === "gender_per_afdeling");
  const contractData = data.find((d) => d.category === "contractvorm_per_gender");

  // Line chart: % vrouwen per functieniveau over time
  const lineChartData = functieniveauData
    ? {
        labels: functieniveauData.data.labels,
        datasets: functieniveauData.data.datasets.map((ds: any, i: number) => ({
          label: ds.label,
          data: ds.data,
          borderColor: chartColors[i % chartColors.length],
          backgroundColor: chartColors[i % chartColors.length] + "20",
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        })),
      }
    : { labels: [], datasets: [] };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "% Vrouwen per Functieniveau (2019-2024)",
        color: "#334155",
        font: { size: 14, weight: "bold" as const },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (val: any) => `${val}%` },
      },
    },
  };

  // Bar chart: gender per afdeling
  const barChartData = afdelingData
    ? {
        labels: afdelingData.data.labels,
        datasets: afdelingData.data.datasets.map((ds: any, i: number) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: i === 0 ? "#E879A0" : "#2E75B6",
        })),
      }
    : { labels: [], datasets: [] };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "Gender Verdeling per Afdeling (%)",
        color: "#334155",
        font: { size: 14, weight: "bold" as const },
      },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (val: any) => `${val}%` } },
    },
  };

  // Stacked bar: contractvormen per gender
  const stackedBarData = contractData
    ? {
        labels: contractData.data.labels,
        datasets: contractData.data.datasets.map((ds: any, i: number) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: i === 0 ? "#E879A0" : "#2E75B6",
        })),
      }
    : { labels: [], datasets: [] };

  const stackedBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "Contractvormen per Gender (%)",
        color: "#334155",
        font: { size: 14, weight: "bold" as const },
      },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (val: any) => `${val}%` } },
    },
  };

  // Donut: overall male/female split (calculated from afdeling data)
  const overallVrouwen = afdelingData
    ? Math.round(
        afdelingData.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0) /
          afdelingData.data.datasets[0].data.length
      )
    : 48;
  const overallMannen = 100 - overallVrouwen;

  const donutData = {
    labels: ["Vrouwen", "Mannen"],
    datasets: [
      {
        data: [overallVrouwen, overallMannen],
        backgroundColor: ["#E879A0", "#2E75B6"],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "Man/Vrouw Verdeling",
        color: "#334155",
        font: { size: 14, weight: "bold" as const },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Data & Rapportage</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Inzicht in diversiteit en gelijkheid binnen uw organisatie.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#64748B]" />
            <Select value={yearFilter} onValueChange={(v) => setYearFilter(v ?? "all")}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Jaar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle jaren</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-[#64748B]">Data laden...</div>
        </div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-[#64748B]">
              Er zijn nog geen gegevens beschikbaar voor uw organisatie.
            </p>
            <p className="text-sm text-[#64748B] mt-1">
              Neem contact op met uw beheerder om data te importeren.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top row: Line chart + Donut */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="h-80">
                  <Line data={lineChartData} options={lineOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-80">
                  <Doughnut data={donutData} options={donutOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom row: Bar charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="h-80">
                  <Bar data={barChartData} options={barOptions} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="h-80">
                  <Bar data={stackedBarData} options={stackedBarOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
