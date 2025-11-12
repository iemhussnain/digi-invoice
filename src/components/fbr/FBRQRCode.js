'use client';

import { useEffect, useRef } from 'react';

/**
 * FBR QR Code Generator Component
 * Generates QR code for FBR Digital Invoicing System
 *
 * NOTE: This requires the 'qrcode' package to be installed:
 * npm install qrcode
 *
 * For now, this is a placeholder that shows where QR code will be rendered
 */

/**
 * Generate QR Code Data String for FBR Invoice
 * Format according to FBR specifications
 */
export function generateFBRQRData(invoiceData) {
  const {
    invoiceNumber,
    invoiceDate,
    totalAmount,
    taxAmount,
    customerNTN,
    sellerNTN,
  } = invoiceData;

  // FBR QR Code format (adjust according to actual FBR specification)
  const qrData = {
    inv: invoiceNumber,
    date: invoiceDate,
    amt: totalAmount.toFixed(2),
    tax: taxAmount.toFixed(2),
    buyer: customerNTN,
    seller: sellerNTN,
  };

  // Convert to JSON string for QR code
  return JSON.stringify(qrData);
}

/**
 * FBR QR Code Component
 * Renders QR code using canvas (requires qrcode npm package)
 */
export function FBRQRCode({ invoiceData, size = 100 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !invoiceData) return;

    // Generate QR data
    const qrData = generateFBRQRData(invoiceData);

    // Try to use QRCode library if available
    const generateQR = async () => {
      try {
        // Check if QRCode is available
        const QRCode = (await import('qrcode')).default;

        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, qrData, {
          width: size,
          margin: 1,
          errorCorrectionLevel: 'M', // Medium error correction
        });
      } catch (error) {
        console.error('QRCode generation failed:', error);
        // Fallback: Draw placeholder
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText('QR Code', 10, size / 2);
        ctx.fillText('(Install qrcode)', 5, size / 2 + 12);
      }
    };

    generateQR();
  }, [invoiceData, size]);

  return (
    <div className="fbr-qr-code">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  );
}

/**
 * FBR Logo Component
 * Displays FBR Digital Invoicing System logo
 */
export function FBRLogo({ size = 'md' }) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={`fbr-logo ${sizes[size]} flex items-center justify-center bg-green-700 rounded`}>
      <div className="text-center text-white">
        <div className="font-bold text-xs">FBR</div>
        <div className="text-[8px] mt-1">Digital</div>
        <div className="text-[8px]">Invoicing</div>
      </div>
    </div>
  );
}

/**
 * FBR Invoice Footer
 * Complete footer with QR code and logo as per FBR requirements
 */
export function FBRInvoiceFooter({ invoiceData }) {
  return (
    <div className="fbr-invoice-footer border-t-2 border-gray-300 pt-4 mt-6">
      <div className="flex items-center justify-between">
        {/* FBR Logo */}
        <div className="text-center">
          <FBRLogo size="md" />
          <p className="text-xs text-gray-600 mt-2 font-semibold">
            FBR Digital Invoicing System
          </p>
        </div>

        {/* QR Code */}
        <div className="text-center">
          <FBRQRCode invoiceData={invoiceData} size={100} />
          <p className="text-xs text-gray-600 mt-2">
            Scan to verify
          </p>
        </div>

        {/* Compliance Info */}
        <div className="text-right text-xs text-gray-600 max-w-xs">
          <p className="font-semibold mb-1">FBR Compliant Invoice</p>
          <p>This invoice is generated through</p>
          <p>FBR approved digital invoicing system</p>
          <p className="mt-2 font-mono text-[10px]">
            Invoice Ref: {invoiceData?.invoiceNumber || 'N/A'}
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-[10px] text-gray-500">
        <p>Federal Board of Revenue, Government of Pakistan</p>
        <p className="mt-1">
          For queries: Visit <span className="font-semibold">https://fbr.gov.pk</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Print-ready FBR Invoice Footer (for PDF/Print)
 * Optimized for printing
 */
export function FBRPrintFooter({ invoiceData }) {
  return (
    <div
      className="fbr-print-footer"
      style={{
        pageBreakInside: 'avoid',
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '2px solid #333',
      }}
    >
      <table style={{ width: '100%', fontSize: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '33%', textAlign: 'center', verticalAlign: 'top' }}>
              {/* Logo placeholder - will be replaced with actual image */}
              <div style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                background: '#0a6f3c',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}>
                <div>
                  <div>FBR</div>
                  <div style={{ fontSize: '7px' }}>Digital<br/>Invoicing</div>
                </div>
              </div>
              <p style={{ marginTop: '8px', fontWeight: 'bold' }}>
                FBR Digital Invoicing System
              </p>
            </td>

            <td style={{ width: '34%', textAlign: 'center', verticalAlign: 'top' }}>
              {/* QR Code */}
              <FBRQRCode invoiceData={invoiceData} size={100} />
              <p style={{ marginTop: '8px' }}>Scan to verify</p>
            </td>

            <td style={{ width: '33%', textAlign: 'right', verticalAlign: 'top' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '6px' }}>FBR Compliant Invoice</p>
              <p>This invoice is generated through</p>
              <p>FBR approved digital invoicing system</p>
              <p style={{ marginTop: '8px', fontSize: '9px', fontFamily: 'monospace' }}>
                Invoice Ref: {invoiceData?.invoiceNumber || 'N/A'}
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{
        marginTop: '12px',
        textAlign: 'center',
        fontSize: '8px',
        color: '#666',
      }}>
        <p>Federal Board of Revenue, Government of Pakistan</p>
        <p style={{ marginTop: '4px' }}>
          For queries: Visit <strong>https://fbr.gov.pk</strong>
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to download FBR logo image
 * Call this to prefetch FBR logo for printing
 */
export function useFBRLogo() {
  useEffect(() => {
    // Prefetch FBR logo if available
    // Replace with actual FBR logo URL when available
    const logoUrl = '/images/fbr-logo.png';

    const img = new Image();
    img.src = logoUrl;

    return () => {
      img.src = '';
    };
  }, []);
}
