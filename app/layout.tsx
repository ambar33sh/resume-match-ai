import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeMatch AI — Resume Intelligence",
  description: "Explainable AI-powered resume screening and job matching.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}