import type { Metadata } from "next";
import { Montserrat, Fira_Code } from "next/font/google";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TEA Techniques",
  description:
    "Explore Techniques for Responsible AI Design, Development, and Deployment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ConditionalLayout>{children}</ConditionalLayout>
            </ThemeProvider>
          </AuthWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
