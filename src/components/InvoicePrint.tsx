import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Venta } from '@/types/venta';
import { Comercio } from '@/types/comercio';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface InvoicePrintProps {
  venta: Venta;
  comercio: Comercio | null;
  cliente: Cliente | null;
}

export const InvoicePrint = ({ venta, comercio, cliente }: InvoicePrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [caeNumber, setCaeNumber] = useState<string>('');
  const [caeExpiry, setCaeExpiry] = useState<string>('');

  useEffect(() => {
    // Generar CAE simulado (en producción vendría de AFIP)
    const cae = `${Math.floor(Math.random() * 10000000000000)}`;
    setCaeNumber(cae);
    
    // Fecha de vencimiento del CAE (típicamente 10 días después)
    const expiryDate = new Date(venta.fecha_venta);
    expiryDate.setDate(expiryDate.getDate() + 10);
    setCaeExpiry(format(expiryDate, 'dd/MM/yyyy'));
  }, [venta]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${venta.numero_comprobante}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              color: #000;
              background: white;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .company-info {
              flex: 1;
              padding-right: 20px;
            }
            .company-name {
              font-size: 18pt;
              font-weight: normal;
              margin-bottom: 15px;
              line-height: 1.2;
            }
            .company-detail {
              margin: 5px 0;
              font-size: 10pt;
            }
            .company-detail strong {
              font-weight: 600;
            }
            .invoice-type {
              width: 70px;
              height: 70px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              border: 3px solid #000;
              padding: 5px;
              margin: 0 20px;
              flex-shrink: 0;
            }
            .invoice-type-letter {
              font-size: 36pt;
              font-weight: bold;
              line-height: 1;
            }
            .invoice-details {
              flex: 1;
              padding-left: 20px;
            }
            .invoice-title {
              font-size: 18pt;
              font-weight: normal;
              margin-bottom: 10px;
            }
            .detail-line {
              margin: 3px 0;
              font-size: 10pt;
            }
            .detail-line strong {
              font-weight: 600;
            }
            .section-divider {
              border-bottom: 2px solid #000;
              margin: 10px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 10px 0;
            }
            .info-line {
              margin: 3px 0;
              font-size: 9pt;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 9pt;
            }
            .products-table th,
            .products-table td {
              border: 1px solid #000;
              padding: 5px;
              text-align: left;
            }
            .products-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .products-table td.number {
              text-align: right;
            }
            .products-table td.center {
              text-align: center;
            }
            .totals-section {
              text-align: right;
              margin-top: 10px;
            }
            .total-line {
              margin: 5px 0;
              font-size: 10pt;
            }
            .total-line.final {
              font-size: 12pt;
              font-weight: bold;
            }
            .footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 20px;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .qr-section {
              text-align: left;
            }
            .cae-section {
              text-align: right;
            }
            strong {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getTipoComprobanteLetra = (tipo: string): string => {
    if (tipo.includes('_a')) return 'A';
    if (tipo.includes('_b')) return 'B';
    if (tipo.includes('_c')) return 'C';
    return 'X';
  };

  const getTipoComprobanteNombre = (tipo: string): string => {
    if (tipo.includes('factura')) return 'Factura';
    if (tipo.includes('nota_credito')) return 'Nota de Crédito';
    if (tipo.includes('nota_debito')) return 'Nota de Débito';
    if (tipo.includes('recibo')) return 'Recibo';
    return 'Comprobante';
  };

  const getCondicionIVA = (situacion?: string): string => {
    if (!situacion) return 'Consumidor Final';
    if (situacion === 'responsable_inscripto') return 'Responsable Inscripto';
    if (situacion === 'monotributo') return 'Monotributo';
    if (situacion === 'exento') return 'Exento';
    return 'Consumidor Final';
  };

  const puntoVenta = venta.numero_comprobante.split('-')[0] || '0001';
  const numeroComp = venta.numero_comprobante.split('-')[1] || '00000001';

  // Datos para el QR
  const qrData = JSON.stringify({
    ver: 1,
    fecha: format(new Date(venta.fecha_venta), 'yyyy-MM-dd'),
    cuit: comercio?.cuit || '',
    ptoVta: puntoVenta,
    tipoCmp: getTipoComprobanteLetra(venta.tipo_comprobante),
    nroCmp: numeroComp,
    importe: venta.total,
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: cliente?.tipo_persona === 'fisica' ? 96 : 80,
    nroDocRec: cliente?.cuit || '',
    tipoCodAut: 'E',
    codAut: caeNumber,
  });

  return (
    <div>
      <div className="mb-4 no-print">
        <Button onClick={handlePrint} className="w-full">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Factura
        </Button>
      </div>

      <div ref={printRef} className="invoice-container bg-white p-6 border">
        <div className="invoice-header">
          <div className="company-info">
            <div className="company-name">{comercio?.nombre_comercio || 'Nombre Comercio'}</div>
            <div className="company-detail"><strong>Razón social:</strong> {comercio?.nombre_comercio || ''}</div>
            <div className="company-detail">
              <strong>Domicilio Comercial:</strong> {comercio?.calle} {comercio?.numero}
            </div>
            <div className="company-detail">
              <strong>Condición Frente al IVA:</strong> Responsable inscripto
            </div>
          </div>

          <div className="invoice-type">
            <div className="invoice-type-letter">{getTipoComprobanteLetra(venta.tipo_comprobante)}</div>
          </div>

          <div className="invoice-details">
            <div className="invoice-title">Factura</div>
            <div className="detail-line"><strong>Punto de Venta:</strong> {puntoVenta} <strong style={{ marginLeft: '20px' }}>Comp. Nro:</strong> {numeroComp}</div>
            <div className="detail-line">
              <strong>Fecha de Emisión:</strong> {format(new Date(venta.fecha_venta), 'dd/MM/yyyy')}
            </div>
            <div className="detail-line"><strong>CUIT:</strong> {comercio?.cuit || ''}</div>
            <div className="detail-line"><strong>Ingresos Brutos:</strong> {comercio?.ingresos_brutos || ''}</div>
            <div className="detail-line">
              <strong>Fecha de Inicio de Actividades:</strong>{' '}
              {comercio?.fecha_inicio_actividad ? format(new Date(comercio.fecha_inicio_actividad), 'dd/MM/yyyy') : ''}
            </div>
          </div>
        </div>

        <div className="section-divider"></div>

        <div className="info-grid">
          <div>
            <div className="info-line">
              <strong>CUIL/CUIT:</strong> {cliente?.cuit || ''}
            </div>
            <div className="info-line">
              <strong>Apellido y Nombre / Razón social:</strong> {venta.cliente_nombre}
            </div>
          </div>
          <div>
            <div className="info-line">
              <strong>Condición Frente al IVA:</strong> {getCondicionIVA(cliente?.situacion_afip)}
            </div>
            <div className="info-line">
              <strong>Domicilio:</strong>{' '}
              {cliente ? `${cliente.calle} ${cliente.numero}` : ''}
            </div>
          </div>
        </div>

        <div className="info-line">
          <strong>Condición de venta:</strong> Efectivo
        </div>

        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Código</th>
              <th>Producto / Servicio</th>
              <th style={{ width: '80px' }}>Cantidad</th>
              <th style={{ width: '80px' }}>U. Medida</th>
              <th style={{ width: '100px' }}>Precio Unit.</th>
              <th style={{ width: '80px' }}>% Bonif.</th>
              <th style={{ width: '100px' }}>Imp. Bonif.</th>
              <th style={{ width: '100px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.venta_items?.map((item, index) => (
              <tr key={index}>
                <td className="center">{item.producto?.cod_producto || ''}</td>
                <td>{item.producto?.descripcion || ''}</td>
                <td className="center">{item.cantidad.toFixed(2)}</td>
                <td className="center">Unidad</td>
                <td className="number">{item.precio_unitario.toFixed(2)}</td>
                <td className="center">0,00</td>
                <td className="number">0,00</td>
                <td className="number">{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals-section">
          <div className="total-line"><strong>Subtotal: $</strong> {venta.subtotal.toFixed(2)}</div>
          <div className="total-line"><strong>Importe Otros Tributos: $</strong> {venta.total_iva.toFixed(2)}</div>
          <div className="total-line final"><strong>Importe total: $</strong> {venta.total.toFixed(2)}</div>
        </div>

        <div className="footer-section">
          <div className="qr-section">
            <QRCodeSVG value={qrData} size={120} />
          </div>
          <div className="cae-section">
            <div className="detail-line"><strong>CAE Nº:</strong> {caeNumber}</div>
            <div className="detail-line"><strong>Fecha de Vto. de CAE:</strong> {caeExpiry}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
