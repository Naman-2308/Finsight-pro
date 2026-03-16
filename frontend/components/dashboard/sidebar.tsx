"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Lightbulb,
  TrendingUp,
  LogOut,
  ChevronRight,
  X,
  Brain,
  ScanLine,
  Siren,
  LineChart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    sectionId: null,
  },
  {
    label: "Receipt Scanner",
    href: "/dashboard#receipt-scanner",
    icon: ScanLine,
    sectionId: "receipt-scanner",
  },
  {
    label: "Budget Forecast",
    href: "/dashboard#forecast",
    icon: LineChart,
    sectionId: "forecast",
  },
  {
    label: "AI Advisor",
    href: "/dashboard#ai-advisor",
    icon: Brain,
    sectionId: "ai-advisor",
  },
  {
    label: "Anomalies",
    href: "/dashboard#anomalies",
    icon: Siren,
    sectionId: "anomalies",
  },
  {
    label: "Insights",
    href: "/dashboard#insights",
    icon: Lightbulb,
    sectionId: "insights",
  },
  {
    label: "Investments",
    href: "/dashboard#investments",
    icon: TrendingUp,
    sectionId: "investments",
  },
  {
    label: "Expenses",
    href: "/dashboard#expenses",
    icon: Receipt,
    sectionId: "expenses",
  },
  {
    label: "Finance",
    href: "/dashboard#finance",
    icon: Wallet,
    sectionId: "finance",
  },
  {
    label: "EMI",
    href: "/dashboard#emi",
    icon: CreditCard,
    sectionId: "emi",
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    const scrollContainer = document.getElementById("dashboard-scroll-container");
    if (!scrollContainer) return;

    const sectionItems = navItems.filter((item) => item.sectionId);

    function getSections() {
      return sectionItems
        .map((item) => {
          const el = document.getElementById(item.sectionId!);
          if (!el) return null;
          return {
            id: item.sectionId!,
            top: el.offsetTop,
          };
        })
        .filter(Boolean) as { id: string; top: number }[];
    }

    function updateActiveSection() {
      const sections = getSections();
      const scrollTop = scrollContainer.scrollTop;
      const activationOffset = 140;

      if (scrollTop < 80) {
        setActiveHash("");
        return;
      }

      let currentId = "";

      for (const section of sections) {
        if (scrollTop + activationOffset >= section.top) {
          currentId = section.id;
        }
      }

      setActiveHash(currentId ? `#${currentId}` : "");
    }

    function syncFromHash() {
      setActiveHash(window.location.hash || "");
    }

    let rafId: number | null = null;

    function handleScroll() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveSection);
    }

    syncFromHash();
    updateActiveSection();

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", syncFromHash);
    window.addEventListener("resize", updateActiveSection);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [pathname]);

  const activeHref = useMemo(() => {
    if (pathname !== "/dashboard") return pathname;
    return activeHash ? `/dashboard${activeHash}` : "/dashboard";
  }, [pathname, activeHash]);

  function isItemActive(href: string) {
    if (href === "/dashboard") {
      return activeHref === "/dashboard";
    }
    return activeHref === href;
  }

  function navigateToItem(sectionId: string | null, href: string) {
    if (sectionId === null) {
      if (pathname !== "/dashboard") {
        router.push("/dashboard");
      } else {
        history.replaceState(null, "", "/dashboard");
        setActiveHash("");
        const scrollContainer = document.getElementById("dashboard-scroll-container");
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
      onClose?.();
      return;
    }

    if (pathname !== "/dashboard") {
      router.push(href);
      onClose?.();
      return;
    }

    const element = document.getElementById(sectionId);
    const scrollContainer = document.getElementById("dashboard-scroll-container");

    if (!element || !scrollContainer) return;

    history.replaceState(null, "", `#${sectionId}`);
    setActiveHash(`#${sectionId}`);

    const targetTop = Math.max(element.offsetTop - 20, 0);

    scrollContainer.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    onClose?.();
  }

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64">
      <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">
            Finsight Pro
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto"
        aria-label="Main navigation"
      >
        {navItems.map(({ label, href, icon: Icon, sectionId }) => {
          const isActive = isItemActive(href);

          return (
            <button
              key={label}
              type="button"
              onClick={() => navigateToItem(sectionId, href)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group text-left",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-primary" : "text-current"
                )}
              />
              <span>{label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
