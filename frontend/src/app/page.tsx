import { BenchmarkApp } from "@/components/benchmark/benchmark-app";
import { getBenchmarkData } from "@/data/benchmark-data";

export const dynamic = "force-static";

export default function Home() {
  const data = getBenchmarkData();

  return <BenchmarkApp data={data} />;
}
