import { PropsWithChildren, useEffect } from "react";
import { usePage } from "@inertiajs/react";

type PageProps = {
  app?: {
    theme?: {
      brandColor?: string;
      fontFamily?: string;
    };
  };
};

export default function AppThemeProvider({ children }: PropsWithChildren) {
  const { props } = usePage<PageProps>();

  useEffect(() => {
    const theme = props?.app?.theme;
    if (!theme) return;

    const root = document.documentElement;

    if (theme.brandColor) root.style.setProperty("--brand", theme.brandColor);
    if (theme.fontFamily) root.style.setProperty("--app-font", theme.fontFamily);
  }, [props?.app?.theme]);

  return <>{children}</>;
}
