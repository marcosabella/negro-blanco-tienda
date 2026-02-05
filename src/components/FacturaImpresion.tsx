import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Venta, TIPOS_PAGO } from "@/types/venta";
import { format } from "date-fns";
import { useComercio } from "@/hooks/useComercio";
import { useAfipConfig } from "@/hooks/useAfipConfig";
import { generarQRAfip } from "@/utils/afipQr";

interface FacturaImpresionProps {
  venta: Venta;
}

// Mapeo de códigos ARCA según tipo de comprobante
const CODIGOS_COMPROBANTE: Record<string, string> = {
  'factura_a': '001',
  'factura_b': '006',
  'factura_c': '011',
  'nota_credito_a': '003',
  'nota_credito_b': '008',
  'nota_credito_c': '013',
  'nota_debito_a': '002',
  'nota_debito_b': '007',
  'nota_debito_c': '012',
  'recibo_a': '004',
  'recibo_b': '009',
  'recibo_c': '015',
  'ticket_fiscal': '083',
  'factura_exportacion': '019',
};

export const FacturaImpresion = ({ venta }: FacturaImpresionProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { comercio } = useComercio();
  const { data: afipConfig } = useAfipConfig();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    
    if (qrDataUrl) {
      const qrImg = clonedContent.querySelector('.qr-container img') as HTMLImageElement;
      if (qrImg) {
        qrImg.src = qrDataUrl;
      }
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura ${venta.numero_comprobante}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              padding: 15px;
              line-height: 1.4;
            }
            .factura-container {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #000;
              min-height: 100vh;
              position: relative;
              padding-bottom: 180px;
            }
            
            /* Indicador ORIGINAL/DUPLICADO */
            .copy-indicator {
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              padding: 5px;
            }
            
            /* Header principal con 3 columnas */
            .header {
              display: flex;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              border-left: 1px solid #000;
              border-right: 1px solid #000;
            }
            .header-left {
              flex: 1;
              padding: 10px;
            }
            .header-center {
              width: 80px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border-left: 2px solid #000;
              border-right: 2px solid #000;
              background: #fff;
              position: relative;
            }
            .header-center::before {
              content: '';
              position: absolute;
              top: -20px;
              left: 50%;
              transform: translateX(-50%);
              width: 2px;
              height: 20px;
              background: #000;
            }
            .header-right {
              flex: 1;
              padding: 10px;
            }
            
            .comercio-nombre {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .comercio-info {
              font-size: 9px;
              line-height: 1.5;
            }
            
            .tipo-letra {
              font-size: 36px;
              font-weight: bold;
              line-height: 1;
            }
            .tipo-codigo {
              font-size: 9px;
              margin-top: 3px;
            }
            
            .factura-titulo {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .factura-info {
              font-size: 10px;
              line-height: 1.6;
            }
            .factura-info strong {
              display: inline-block;
              min-width: 100px;
            }
            
            /* Sección períodos */
            .periodo-section {
              display: flex;
              border-bottom: 1px solid #000;
              font-size: 9px;
            }
            .periodo-item {
              flex: 1;
              padding: 5px 10px;
              border-right: 1px solid #000;
            }
            .periodo-item:last-child {
              border-right: none;
            }
            
            /* Sección cliente */
            .cliente-section {
              border-bottom: 1px solid #000;
              padding: 10px;
            }
            .cliente-row {
              display: flex;
              gap: 20px;
              margin-bottom: 5px;
            }
            .cliente-row:last-child {
              margin-bottom: 0;
            }
            .cliente-field {
              font-size: 10px;
            }
            .cliente-field strong {
              margin-right: 5px;
            }
            
            /* Tabla de items */
            .items-section {
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #d6e8f5;
              padding: 6px 4px;
              text-align: center;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              font-weight: bold;
              font-size: 9px;
            }
            th:first-child {
              border-left: 1px solid #000;
            }
            th:last-child {
              border-right: 1px solid #000;
            }
            td {
              padding: 6px 4px;
              font-size: 9px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            
            /* Totales */
            .totales-section {
              position: absolute;
              bottom: 200px;
              left: 0;
              right: 0;
              padding: 10px;
              background: #fff;
            }
            .totales-row {
              display: flex;
              justify-content: flex-end;
              gap: 20px;
              margin-bottom: 3px;
            }
            .totales-row:last-child {
              margin-bottom: 0;
            }
            .totales-label {
              font-size: 10px;
              min-width: 150px;
              text-align: right;
            }
            .totales-value {
              font-size: 10px;
              font-weight: bold;
              min-width: 100px;
              text-align: right;
            }
            .total-final {
              font-size: 14px;
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            
            /* Footer ARCA */
            .footer-section {
              display: flex;
              padding: 10px;
              gap: 15px;
              position: absolute;
              bottom: 25px;
              left: 0;
              right: 0;
              border-top: 1px solid #000;
            }
            .footer-left {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }
            .footer-center {
              flex: 2;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .footer-right {
              flex: 1;
              display: flex;
              flex-direction: column;
              align-items: flex-end;
            }
            
            .arca-logo {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .arca-text {
              font-size: 8px;
              text-align: center;
              margin-top: 5px;
            }
            
            .cae-info {
              font-size: 10px;
              text-align: right;
            }
            .cae-info div {
              margin-bottom: 3px;
            }
            
            .qr-container {
              width: 100px;
              height: 100px;
              border: 1px solid #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            
            .disclaimer-full {
              font-size: 7px;
              text-align: center;
              padding: 5px 10px;
              color: #666;
              border-top: 1px solid #ccc;
              position: absolute;
              bottom: 15px;
              left: 0;
              right: 0;
            }
            .page-number {
              font-size: 8px;
              position: absolute;
              bottom: 3px;
              left: 10px;
            }
            
            @media print {
              body {
                padding: 0;
              }
              .factura-container {
                border: none;
              }
            }
          </style>
        </head>
        <body>
          ${clonedContent.innerHTML}
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

  const getTipoComprobanteLetra = () => {
    const tipo = venta.tipo_comprobante;
    if (tipo.includes('_a')) return 'A';
    if (tipo.includes('_b')) return 'B';
    if (tipo.includes('_c')) return 'C';
    return '';
  };

  const getTipoComprobanteNombre = () => {
    const tipo = venta.tipo_comprobante;
    if (tipo.includes('factura') && !tipo.includes('exportacion')) return 'FACTURA';
    if (tipo.includes('nota_credito')) return 'NOTA DE CRÉDITO';
    if (tipo.includes('nota_debito')) return 'NOTA DE DÉBITO';
    if (tipo.includes('recibo')) return 'RECIBO';
    if (tipo === 'ticket_fiscal') return 'TICKET FISCAL';
    if (tipo === 'factura_exportacion') return 'FACTURA DE EXPORTACIÓN';
    return 'COMPROBANTE';
  };

  const getCodigoComprobante = () => {
    return CODIGOS_COMPROBANTE[venta.tipo_comprobante] || '000';
  };

  const formatNumeroComprobante = () => {
    // Formato: Punto de Venta: 00001  Comp. Nro: 00000071
    const parts = venta.numero_comprobante.split('-');
    if (parts.length === 2) {
      return {
        puntoVenta: parts[0].padStart(5, '0'),
        numero: parts[1].padStart(8, '0')
      };
    }
    return {
      puntoVenta: afipConfig?.punto_venta?.toString().padStart(5, '0') || '00001',
      numero: venta.numero_comprobante.padStart(8, '0')
    };
  };

  const getTipoPagoLabel = () => {
    const pago = TIPOS_PAGO.find(t => t.value === venta.tipo_pago);
    if (venta.tipo_pago === 'transferencia') return 'Transferencia Bancaria';
    if (venta.tipo_pago === 'tarjeta') return 'Tarjeta de Crédito/Débito';
    return pago?.label || venta.tipo_pago;
  };

  // Generar QR cuando hay CAE
  useEffect(() => {
    if (venta.cae && comercio && afipConfig) {
      generarQRAfip({
        fecha: venta.fecha_venta,
        cuit: comercio.cuit,
        puntoVenta: afipConfig.punto_venta,
        tipoComprobante: venta.tipo_comprobante,
        numeroComprobante: venta.numero_comprobante,
        importe: venta.total,
        cae: venta.cae,
      })
        .then(setQrDataUrl)
        .catch((error) => {
          console.error('Error generando QR AFIP:', error);
          setQrDataUrl('');
        });
    } else {
      setQrDataUrl('');
    }
  }, [venta.cae, venta.fecha_venta, venta.tipo_comprobante, venta.numero_comprobante, venta.total, comercio, afipConfig]);

  const comercioData = comercio;
  const numComprobante = formatNumeroComprobante();
  const fechaVenta = format(new Date(venta.fecha_venta), 'dd/MM/yyyy');

  return (
    <>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir Factura
      </Button>

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="factura-container">
            {/* Indicador ORIGINAL */}
            <div className="copy-indicator">ORIGINAL</div>
            
            {/* Header principal */}
            <div className="header">
              {/* Datos del emisor */}
              <div className="header-left">
                <div className="comercio-nombre">{comercioData?.nombre_comercio || 'COMERCIO'}</div>
                <div className="comercio-info">
                  <div><strong>Razón Social:</strong> {comercioData?.nombre_comercio}</div>
                  <div><strong>Domicilio Comercial:</strong> {comercioData?.calle} {comercioData?.numero} - {comercioData?.localidad}, {comercioData?.provincia}</div>
                  <div><strong>CUIT:</strong> {comercioData?.cuit}</div>
                </div>
              </div>

              {/* Letra y código del comprobante */}
              <div className="header-center">
                <div className="tipo-letra">{getTipoComprobanteLetra()}</div>
                <div className="tipo-codigo">COD. {getCodigoComprobante()}</div>
              </div>

              {/* Datos de la factura */}
              <div className="header-right">
                <div className="factura-titulo">{getTipoComprobanteNombre()}</div>
                <div className="factura-info">
                  <div><strong>Punto de Venta:</strong> {numComprobante.puntoVenta}  <strong>Comp. Nro:</strong> {numComprobante.numero}</div>
                  <div><strong>Fecha de Emisión:</strong> {fechaVenta}</div>
                  <div style={{ marginTop: '10px' }}></div>
                  <div><strong>Ingresos Brutos:</strong> {comercioData?.ingresos_brutos || 'N/A'}</div>
                  <div><strong>Condición frente al IVA:</strong> Responsable Inscripto</div>
                  <div><strong>Fecha de Inicio de Actividades:</strong> {comercioData?.fecha_inicio_actividad ? format(new Date(comercioData.fecha_inicio_actividad), 'dd/MM/yyyy') : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Período facturado y vencimiento */}
            <div className="periodo-section">
              <div className="periodo-item">
                <strong>Período Facturado Desde:</strong> {fechaVenta}  <strong>Hasta:</strong> {fechaVenta}
              </div>
              <div className="periodo-item">
                <strong>Fecha de Vto. para el pago:</strong> {fechaVenta}
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="cliente-section">
              <div className="cliente-row">
                <div className="cliente-field">
                  <strong>CUIT:</strong> N/A
                </div>
                <div className="cliente-field">
                  <strong>Apellido y Nombre / Razón Social:</strong> {venta.cliente_nombre}
                </div>
              </div>
              <div className="cliente-row">
                <div className="cliente-field">
                  <strong>Domicilio:</strong> N/A
                </div>
              </div>
              <div className="cliente-row">
                <div className="cliente-field">
                  <strong>Condición frente al IVA:</strong> Consumidor Final
                </div>
                <div className="cliente-field">
                  <strong>Condición de venta:</strong> {getTipoPagoLabel()}
                </div>
              </div>
            </div>

            {/* Tabla de items */}
            <div className="items-section">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Código Producto / Servicio</th>
                    <th style={{ width: '10%' }}>Cantidad</th>
                    <th style={{ width: '12%' }}>U. Medida</th>
                    <th style={{ width: '15%' }}>Precio Unit.</th>
                    <th style={{ width: '8%' }}>% Bonif</th>
                    <th style={{ width: '10%' }}>Imp. Bonif.</th>
                    <th style={{ width: '15%' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.venta_items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.producto?.descripcion || item.producto?.cod_producto}</td>
                      <td className="text-right">{item.cantidad.toFixed(2).replace('.', ',')}</td>
                      <td className="text-center">unidades</td>
                      <td className="text-right">{item.precio_unitario.toFixed(2).replace('.', ',')}</td>
                      <td className="text-right">0,00</td>
                      <td className="text-right"></td>
                      <td className="text-right">{item.subtotal.toFixed(2).replace('.', ',')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="totales-section">
              <div className="totales-row">
                <div className="totales-label">Subtotal:</div>
                <div className="totales-value">$ {venta.subtotal.toFixed(2).replace('.', ',')}</div>
              </div>
              <div className="totales-row">
                <div className="totales-label">Importe Otros Tributos:</div>
                <div className="totales-value">$ 0,00</div>
              </div>
              <div className="totales-row total-final">
                <div className="totales-label">Importe Total:</div>
                <div className="totales-value">$ {venta.total.toFixed(2).replace('.', ',')}</div>
              </div>
            </div>

            {/* Footer - CAE y QR estilo ARCA */}
            <div className="footer-section">
              <div className="footer-left">
                <div className="qr-container">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR AFIP" />
                  ) : (
                    <div style={{ fontSize: '8px', textAlign: 'center', padding: '10px' }}>
                      {venta.cae ? 'QR AFIP' : 'Sin CAE'}
                    </div>
                  )}
                </div>
                <div className="arca-text">
                  <strong>Comprobante Autorizado</strong>
                </div>
                <div className="arca-logo">ARCA</div>
              </div>
              
              <div className="footer-center">
              </div>
              
              <div className="footer-right">
                <div className="cae-info">
                  {venta.cae ? (
                    <>
                      <div><strong>CAE N°:</strong> {venta.cae}</div>
                      <div><strong>Vto. de CAE:</strong> {venta.cae_vencimiento ? format(new Date(venta.cae_vencimiento), 'dd/MM/yyyy') : 'N/A'}</div>
                    </>
                  ) : (
                    <>
                      <div><strong>CAE N°:</strong> Pendiente</div>
                      <div><strong>Vto. de CAE:</strong> Pendiente</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Disclaimer y paginación */}
            <div className="disclaimer-full">
              AGENCIA DE RECAUDACIÓN Y CONTROL ADUANERO - Esta Agencia no se responsabiliza por los datos ingresados en el detalle de la operación
            </div>
            <div className="page-number">Pág. 1/1</div>
          </div>
        </div>
      </div>
    </>
  );
};
