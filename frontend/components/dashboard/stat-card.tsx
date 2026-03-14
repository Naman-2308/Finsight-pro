import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label?: string };
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="w-8 h-8 bg-muted rounded-lg" />
        </div>
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", `group-hover:bg-primary/10`)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              trend.value >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label && (
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
