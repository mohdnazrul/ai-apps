import React from "react";

const logoUrl =
  "https://static.vecteezy.com/system/resources/previews/023/783/293/non_2x/artificial-intelligence-generated-icon-ai-sign-for-graphic-design-logo-website-social-media-mobile-app-ui-illustration-vector.jpg";

export default function AppLogoIcon(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src={logoUrl}
      alt={props.alt ?? "App Logo"}
      loading={props.loading ?? "lazy"}
      draggable={false}
    />
  );
}
