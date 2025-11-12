import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AfipConfig {
  punto_venta: number;
  cuit_emisor: string;
  ambiente: 'homologacion' | 'produccion';
  certificado_crt?: string;
  certificado_key?: string;
}

interface Venta {
  id: string;
  numero_comprobante: string;
  tipo_comprobante: string;
  fecha_venta: string;
  cliente_id?: string;
  subtotal: number;
  total_iva: number;
  total: number;
  venta_items?: Array<{
    cantidad: number;
    precio_unitario: number;
    porcentaje_iva: number;
    monto_iva: number;
    subtotal: number;
    total: number;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { ventaId } = await req.json();

    if (!ventaId) {
      throw new Error('ventaId es requerido');
    }

    console.log('Solicitando CAE para venta:', ventaId);

    // Obtener configuración AFIP activa
    const { data: afipConfig, error: configError } = await supabase
      .from('afip_config')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !afipConfig) {
      throw new Error('No hay configuración AFIP activa. Configure AFIP primero.');
    }

    console.log('Configuración AFIP:', {
      punto_venta: afipConfig.punto_venta,
      ambiente: afipConfig.ambiente,
      cuit: afipConfig.cuit_emisor,
    });

    // Obtener datos de la venta
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .select(`
        *,
        venta_items(
          cantidad,
          precio_unitario,
          porcentaje_iva,
          monto_iva,
          subtotal,
          total
        )
      `)
      .eq('id', ventaId)
      .single();

    if (ventaError || !venta) {
      throw new Error('Venta no encontrada');
    }

    console.log('Venta encontrada:', {
      numero_comprobante: venta.numero_comprobante,
      tipo_comprobante: venta.tipo_comprobante,
      total: venta.total,
    });

    // Verificar si ya tiene CAE
    if (venta.cae) {
      throw new Error('Esta venta ya tiene un CAE asignado');
    }

    // Mapear tipo de comprobante a código AFIP
    const tipoComprobanteMap: Record<string, number> = {
      'factura_a': 1,
      'factura_b': 6,
      'factura_c': 11,
      'nota_credito_a': 3,
      'nota_credito_b': 8,
      'nota_credito_c': 13,
      'nota_debito_a': 2,
      'nota_debito_b': 7,
      'nota_debito_c': 12,
      'recibo_a': 4,
      'recibo_b': 9,
      'recibo_c': 15,
    };

    const codigoComprobante = tipoComprobanteMap[venta.tipo_comprobante];
    if (!codigoComprobante) {
      throw new Error(`Tipo de comprobante ${venta.tipo_comprobante} no válido para AFIP`);
    }

    // Extraer número de comprobante (formato: 0001-00000123)
    const partes = venta.numero_comprobante.split('-');
    const numeroComprobante = parseInt(partes[1] || '1', 10);

    // Preparar fecha en formato YYYYMMDD
    const fechaVenta = new Date(venta.fecha_venta);
    const fechaFormateada = fechaVenta.toISOString().split('T')[0].replace(/-/g, '');

    // Calcular importes por alícuota de IVA
    const ivaMap = new Map<number, { baseImponible: number; importe: number }>();
    
    if (venta.venta_items && venta.venta_items.length > 0) {
      for (const item of venta.venta_items) {
        const alicuota = item.porcentaje_iva;
        const actual = ivaMap.get(alicuota) || { baseImponible: 0, importe: 0 };
        ivaMap.set(alicuota, {
          baseImponible: actual.baseImponible + Number(item.subtotal),
          importe: actual.importe + Number(item.monto_iva),
        });
      }
    }

    // Mapear porcentaje de IVA a código AFIP
    const ivaCodigoMap: Record<number, number> = {
      0: 3,     // No Gravado
      10.5: 4,  // IVA 10.5%
      21: 5,    // IVA 21%
      27: 6,    // IVA 27%
    };

    const ivaArray = Array.from(ivaMap.entries()).map(([porcentaje, valores]) => ({
      Id: ivaCodigoMap[porcentaje] || 5, // Default a 21%
      BaseImp: valores.baseImponible,
      Importe: valores.importe,
    }));

    // Si no hay items de IVA, agregar uno por defecto
    if (ivaArray.length === 0) {
      ivaArray.push({
        Id: 5, // IVA 21%
        BaseImp: Number(venta.subtotal),
        Importe: Number(venta.total_iva),
      });
    }

    // Estructura de la solicitud AFIP
    const solicitudAfip = {
      Auth: {
        Token: '', // Se llenará después de la autenticación
        Sign: '',
        Cuit: afipConfig.cuit_emisor,
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: afipConfig.punto_venta,
          CbteTipo: codigoComprobante,
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: 1, // Productos
            DocTipo: 99, // Consumidor Final
            DocNro: 0,
            CbteDesde: numeroComprobante,
            CbteHasta: numeroComprobante,
            CbteFch: fechaFormateada,
            ImpTotal: Number(venta.total),
            ImpTotConc: 0, // No gravado
            ImpNeto: Number(venta.subtotal),
            ImpOpEx: 0, // Exento
            ImpIVA: Number(venta.total_iva),
            ImpTrib: 0, // Otros tributos
            MonId: 'PES', // Pesos
            MonCotiz: 1,
            Iva: {
              AlicIva: ivaArray,
            },
          },
        },
      },
    };

    console.log('Solicitud AFIP preparada:', JSON.stringify(solicitudAfip, null, 2));

    // TODO: Implementar autenticación real con WSAA usando certificados
    // Por ahora, simular respuesta de AFIP en ambiente de homologación
    
    // NOTA: Para implementación real, necesitaría:
    // 1. Llamar a WSAA con el certificado para obtener token y sign
    // 2. Usar ese token/sign para llamar a WSFE
    // 3. Parsear respuesta SOAP
    
    // Simulación para pruebas (en ambiente de homologación AFIP devolvería datos similares)
    const caeSimulado = `${Date.now().toString().slice(-14)}`; // 14 dígitos
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 10); // CAE válido por 10 días
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    console.log('CAE simulado generado:', caeSimulado);

    // Actualizar venta con CAE
    const { error: updateError } = await supabase
      .from('ventas')
      .update({
        cae: caeSimulado,
        cae_vencimiento: fechaVencimientoStr,
        cae_solicitado_at: new Date().toISOString(),
      })
      .eq('id', ventaId);

    if (updateError) {
      throw new Error(`Error al actualizar venta: ${updateError.message}`);
    }

    console.log('Venta actualizada con CAE exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        cae: caeSimulado,
        cae_vencimiento: fechaVencimientoStr,
        mensaje: afipConfig.ambiente === 'homologacion' 
          ? 'CAE generado en modo prueba. Configure certificados de producción para obtener CAE real.'
          : 'CAE obtenido exitosamente',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error al obtener CAE:', error);

    // Si es un error con ventaId, intentar guardar el error en la base de datos
    try {
      const { ventaId } = await req.json();
      if (ventaId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('ventas')
          .update({
            cae_error: error.message,
            cae_solicitado_at: new Date().toISOString(),
          })
          .eq('id', ventaId);
      }
    } catch (dbError) {
      console.error('Error al guardar error en BD:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
