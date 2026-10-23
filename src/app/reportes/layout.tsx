import type { ReactNode } from "react";
import { ReportQueryProvider } from "@/components/query/report-query-provider";

export default function ReportesLayout({ children }: { children: ReactNode }) {
  return <ReportQueryProvider>{children}</ReportQueryProvider>;
}
