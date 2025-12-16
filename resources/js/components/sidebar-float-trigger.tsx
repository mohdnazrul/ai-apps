import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export default function SidebarFloatTrigger() {
  const { open, toggleSidebar } = useSidebar(); // explain below if your hook names differ

  return (
    <div
      className={cn(
        "fixed left-[72px] top-24 z-50",   // 72px = collapsed sidebar width (adjust if needed)
        "transition-all"
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 rounded-full shadow"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}
