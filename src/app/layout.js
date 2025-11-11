import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>DigInvoice ERP</title>
        <meta name="description" content="Modern ERP solution for digital invoicing" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
