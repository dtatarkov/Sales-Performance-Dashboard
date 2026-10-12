import type { Metadata } from "next";
import "./globals.css";

/**
 * Корневой layout — минимален: html/body и глобальные стили.
 * Провайдеры (DashboardQueryContext, QueryProvider, Toaster) живут в page.tsx —
 * единственной странице приложения (frontend.md §2).
 */
export const metadata: Metadata = {
  title: "Sales Performance Dashboard",
  description: "Дашборд аналитики продаж",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}