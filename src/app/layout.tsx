import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import Providers from "@/components/Providers";
import { NOME_BRECHO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: { default: NOME_BRECHO, template: `%s · ${NOME_BRECHO}` },
  description: "Brechó solidário: roupas usadas em bom estado, moda circular e consumo consciente.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E6B47",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
