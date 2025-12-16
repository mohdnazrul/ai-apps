import { ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

export default function SidebarEdgeToggle() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // your Sidebar root is: data-slot="sidebar"
    const root = document.querySelector('[data-slot="sidebar"]');
    if (!root) return;

    const read = () => setCollapsed(root.getAttribute("data-state") === "collapsed");

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["data-state"] });

    read();
    return () => observer.disconnect();
  }, []);

  return (
    <SidebarTrigger
      className="
        absolute -right-6 top-1 z-50
        h-10 w-10 rounded-full
        border bg-background shadow
        flex items-center justify-center
      "
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {collapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </SidebarTrigger>
  );
}
