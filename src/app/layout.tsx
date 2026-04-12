import type { Metadata } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import TanstackProvider from "@/providers/TanstackProvider";
import { GLOBAL_CONSTANTS } from "@/constants/globalConstants";

const loraHeading = Lora({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "wholesale",
  description: "wholesale",
  icons: {
    icon: GLOBAL_CONSTANTS.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", loraHeading.variable)}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col mx-auto "
        suppressHydrationWarning
      >
        <TanstackProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <Header />
              {children}
              <Toaster richColors position="top-right" />
              <Footer />
            </TooltipProvider>
          </ThemeProvider>
        </TanstackProvider>
      </body>
    </html>
  );
}
