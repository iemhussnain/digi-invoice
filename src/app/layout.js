import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import ToastProvider from "@/providers/ToastProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>DigInvoice ERP</title>
        <meta name="description" content="Modern ERP solution for digital invoicing" />
      </head>
      <body className="antialiased">
        <ToastProvider />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
