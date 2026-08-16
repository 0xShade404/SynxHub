import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = [
    "",
    "/transparency",
    "/security",
    "/contact",
    "/login",
    "/signup",
    "/legal/terms",
    "/legal/privacy",
    "/legal/risk-disclosure",
    "/legal/aml-kyc",
    "/legal/cookies",
    "/legal/withdrawal-policy",
  ];
  return routes.map((route) => ({
    url: `${appUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.6,
  }));
}
