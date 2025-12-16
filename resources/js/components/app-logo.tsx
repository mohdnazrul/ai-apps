import { usePage } from "@inertiajs/react";
import AppLogoIcon from "./app-logo-icon";

type PageProps = {
  app?: {
    name?: string;
  };
};

export default function AppLogo() {
  const { props } = usePage<PageProps>();
  const appName = props?.app?.name ?? import.meta.env.VITE_APP_NAME ?? "Laravel";

  return (
    <>
      <div className="flex aspect-square size-16 items-center justify-center rounded-md overflow-hidden">
        <AppLogoIcon className="object-contain" />
      </div>

      <div className="ml-1 grid flex-1 text-left text-sm">
        {/* uses CSS var */}
        <span
          className="mb-0.5 truncate leading-tight font-semibold"
          style={{ color: "var(--brand)" }}
        >
          {appName}
        </span>
      </div>
    </>
  );
}
