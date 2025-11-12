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

export const FacturaImpresion = ({ venta }: FacturaImpresionProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { comercio } = useComercio();
  const { data: afipConfig } = useAfipConfig();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    // Clonar el contenido y reemplazar el QR con el data URL si existe
    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    
    // Si hay QR generado, actualizar la imagen en el clon
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
              font-size: 11px;
              padding: 20px;
            }
            .factura-container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #000;
            }
            .header {
              display: flex;
              border-bottom: 2px solid #000;
            }
            .header-left, .header-right {
              flex: 1;
              padding: 10px;
            }
            .header-center {
              width: 100px;
              border-left: 2px solid #000;
              border-right: 2px solid #000;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 10px;
            }
            .tipo-comprobante {
              font-size: 32px;
              font-weight: bold;
              line-height: 1;
            }
            .documento-type {
              font-size: 10px;
              margin-top: 5px;
            }
            .header-left strong, .header-right strong {
              font-size: 14px;
            }
            .cliente-section {
              padding: 10px;
              border-bottom: 1px solid #000;
            }
            .cliente-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 5px;
            }
            .items-section {
              padding: 10px;
              border-bottom: 1px solid #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f0f0f0;
              padding: 5px;
              text-align: left;
              border: 1px solid #000;
              font-weight: bold;
            }
            td {
              padding: 5px;
              border: 1px solid #000;
            }
            .text-right {
              text-align: right;
            }
            .totales-section {
              padding: 10px;
              border-bottom: 1px solid #000;
            }
            .totales-grid {
              display: grid;
              grid-template-columns: 1fr auto;
              gap: 10px;
              max-width: 400px;
              margin-left: auto;
            }
            .pagos-section {
              padding: 10px;
              border-bottom: 1px solid #000;
            }
            .footer-section {
              padding: 10px;
              font-size: 9px;
            }
            .cae-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
            }
            .qr-container {
              width: 120px;
              height: 120px;
              border: 1px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 10px auto;
              overflow: hidden;
            }
            .qr-container img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .qr-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              text-align: center;
            }
            .bold {
              font-weight: bold;
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
    if (tipo.includes('factura')) return 'FACTURA';
    if (tipo.includes('nota_credito')) return 'NOTA DE CRÉDITO';
    if (tipo.includes('nota_debito')) return 'NOTA DE DÉBITO';
    if (tipo.includes('recibo')) return 'RECIBO';
    if (tipo === 'ticket_fiscal') return 'TICKET FISCAL';
    if (tipo === 'factura_exportacion') return 'FACTURA DE EXPORTACIÓN';
    return 'COMPROBANTE';
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

  return (
    <>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="h-4 w-4 mr-2" />
        Imprimir Factura
      </Button>

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          <div className="factura-container">
            {/* Header */}
            <div className="header">
              <div className="header-left">
                <strong>{comercioData?.nombre_comercio || 'COMERCIO'}</strong>
                <div>
                  Domicilio: {comercioData?.calle} {comercioData?.numero}
                </div>
                <div>
                  {comercioData?.codigo_postal} - {comercioData?.localidad} - {comercioData?.provincia}
                </div>
                <div>Tel: {comercioData?.telefono || 'N/A'}</div>
                <div style={{ marginTop: '10px' }}>
                  <strong>CUIT:</strong> {comercioData?.cuit}
                </div>
                <div>
                  <strong>Ing. Brutos:</strong> {comercioData?.ingresos_brutos || 'N/A'}
                </div>
                <div>
                  <strong>Inicio Actividades:</strong> {comercioData?.fecha_inicio_actividad ? format(new Date(comercioData.fecha_inicio_actividad), 'dd/MM/yyyy') : 'N/A'}
                </div>
              </div>

              <div className="header-center">
                <div className="tipo-comprobante">{getTipoComprobanteLetra()}</div>
                <div className="documento-type">COD. {venta.tipo_comprobante === 'factura_a' ? '01' : venta.tipo_comprobante === 'factura_b' ? '06' : '11'}</div>
              </div>

              <div className="header-right">
                <strong>{getTipoComprobanteNombre()}</strong>
                <div style={{ marginTop: '10px' }}>
                  <strong>Nro:</strong> {venta.numero_comprobante}
                </div>
                <div>
                  <strong>Fecha:</strong> {format(new Date(venta.fecha_venta), 'dd/MM/yyyy')}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <strong>ORIGINAL</strong>
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div className="cliente-section">
              <div><strong>DATOS DEL CLIENTE</strong></div>
              <div className="cliente-grid">
                <div>
                  <strong>Razón Social/Nombre:</strong> {venta.cliente_nombre}
                </div>
                <div>
                  <strong>CUIT/DNI:</strong> {venta.cliente?.apellido ? `${venta.cliente.nombre} ${venta.cliente.apellido}` : 'N/A'}
                </div>
                <div>
                  <strong>Condición IVA:</strong> Consumidor Final
                </div>
                <div>
                  <strong>Condición de Venta:</strong> {TIPOS_PAGO.find(t => t.value === venta.tipo_pago)?.label || venta.tipo_pago}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="items-section">
              <div><strong>DETALLE DE PRODUCTOS/SERVICIOS</strong></div>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Código</th>
                    <th>Descripción</th>
                    <th style={{ width: '80px' }}>Cantidad</th>
                    <th style={{ width: '100px' }}>P. Unitario</th>
                    <th style={{ width: '80px' }}>% IVA</th>
                    <th style={{ width: '100px' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.venta_items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.producto?.cod_producto}</td>
                      <td>{item.producto?.descripcion}</td>
                      <td className="text-right">{item.cantidad}</td>
                      <td className="text-right">${item.precio_unitario.toFixed(2)}</td>
                      <td className="text-right">{item.porcentaje_iva}%</td>
                      <td className="text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="totales-section">
              <div className="totales-grid">
                <div>Subtotal:</div>
                <div className="text-right bold">${venta.subtotal.toFixed(2)}</div>
                <div>IVA:</div>
                <div className="text-right bold">${venta.total_iva.toFixed(2)}</div>
                <div>TOTAL:</div>
                <div className="text-right bold" style={{ fontSize: '14px' }}>${venta.total.toFixed(2)}</div>
              </div>
            </div>

            {/* Métodos de Pago */}
            {venta.pagos_venta && venta.pagos_venta.length > 0 && (
              <div className="pagos-section">
                <div><strong>MÉTODOS DE PAGO</strong></div>
                <table style={{ marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th>Método</th>
                      <th>Detalle</th>
                      <th style={{ width: '120px' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venta.pagos_venta.map((pago, index) => (
                      <tr key={index}>
                        <td>{TIPOS_PAGO.find(t => t.value === pago.tipo_pago)?.label}</td>
                        <td>
                          {pago.tipo_pago === 'tarjeta' && pago.tarjeta && (
                            <span>{pago.tarjeta.nombre} - {pago.cuotas} cuota(s)</span>
                          )}
                          {pago.tipo_pago === 'transferencia' && pago.banco && (
                            <span>{pago.banco.nombre_banco}</span>
                          )}
                          {pago.tipo_pago === 'cheque' && pago.cheque && (
                            <span>N° {pago.cheque.numero_cheque}</span>
                          )}
                          {(pago.tipo_pago === 'contado' || pago.tipo_pago === 'cta_cte') && '-'}
                        </td>
                        <td className="text-right">${pago.monto.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer - CAE y QR */}
            <div className="footer-section">
              <div className="cae-info">
                <div>
                  {venta.cae ? (
                    <>
                      <div><strong>CAE N°:</strong> {venta.cae}</div>
                      <div><strong>Fecha Vto. CAE:</strong> {venta.cae_vencimiento ? format(new Date(venta.cae_vencimiento), 'dd/MM/yyyy') : 'N/A'}</div>
                    </>
                  ) : (
                    <>
                      <div><strong>CAE N°:</strong> (Pendiente - Usar botón "Obtener CAE")</div>
                      <div><strong>Fecha Vto. CAE:</strong> (Pendiente)</div>
                    </>
                  )}
                </div>
                <div>
                  <div className="qr-container">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR AFIP" />
                    ) : (
                      <div className="qr-placeholder">
                        {venta.cae ? 'Código QR AFIP' : 'Sin CAE - Use botón "Obtener CAE"'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '8px', textAlign: 'center' }}>
                Comprobante autorizado por ARCA (ex AFIP). Este documento cumple con las disposiciones vigentes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};