"use client";

import { useRef } from "react";
import { TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePermissions } from "@/app/(demo)/permissions/_components/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import DownloadChart from "@/components/download/DownloadChart";

const SLICE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ChartPieSeparatorNone() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { data: permissionsData, isLoading } = usePermissions();

  const rows = Array.isArray(permissionsData) ? permissionsData : [];

  const chartData = (rows as any[]).map((permission: any, index: number) => ({
    name: permission.cat_name,
    value: 1,
    status: permission.cat_status,
    fill: SLICE_COLORS[index % SLICE_COLORS.length],
  }));

  const activeCount = (rows as any[]).filter(
    (p: any) => p.cat_status === "Y",
  ).length;

  const chartConfig = chartData.reduce<ChartConfig>((acc, item) => {
    acc[item.name] = { label: item.name, color: item.fill };
    return acc;
  }, {});

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-0">
        <div>
          <CardTitle>Permission Categories</CardTitle>
          <CardDescription>Distribution of all categories</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-0">
        {isLoading ? (
          <div className="mx-auto flex aspect-square max-h-[250px] items-center justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex aspect-square max-h-[250px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div ref={chartRef}>
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  stroke="0"
                  paddingAngle={0}
                >
                  {chartData.map((entry: { fill: string }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {activeCount} of {chartData.length} categories active{" "}
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing all {chartData.length} permission categories
        </div>
      </CardFooter>
    </Card>
  );
}
