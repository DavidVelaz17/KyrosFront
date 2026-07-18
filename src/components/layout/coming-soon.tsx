import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function ComingSoon({ icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex h-full flex-col">
      <EmptyState icon={icon} title={title} description={description} />
    </div>
  );
}
