import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función para crear el TRA (Ticket de Requerimiento de Acceso)
function crearTRA(service: string): string {
  const ahora = new Date();
  const generationTime = new Date(ahora.getTime() - 10 * 60000);
  const expirationTime = new Date(ahora.getTime() + 10 * 60000);
  const uniqueId = Date.now();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${generationTime.toISOString()}</generationTime>
    <expirationTime>${expirationTime.toISOString()}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
}

// Función para firmar el TRA
async function firmarTRA(tra: string, certPem: string, keyPem: string): Promise<string> {
  try {
    const keyData = keyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(tra);
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      data
    );

    const cms = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0><![CDATA[${btoa(tra)}]]></wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

    return cms;
  } catch (error) {
    console.error('Error al firmar TRA:', error);
    throw new Error(`Error al firmar TRA: ${error.message}`);
  }
}

// Función para obtener token y sign de WSAA
async function obtenerTokenYSign(
  certPem: string,
  keyPem: string,
  service: string,
  ambiente: 'homologacion' | 'produccion'
): Promise<{ token: string; sign: string }> {
  try {
    const tra = crearTRA(service);
    const cms = await firmarTRA(tra, certPem, keyPem);
    
    const wsaaUrl = ambiente === 'produccion'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    
    const response = await fetch(wsaaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: cms,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en WSAA: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    const tokenMatch = responseText.match(/<token>(.*?)<\/token>/s);
    const signMatch = responseText.match(/<sign>(.*?)<\/sign>/s);

    if (!tokenMatch || !signMatch) {
      throw new Error('No se pudo extraer token y sign de WSAA');
    }

    return {
      token: tokenMatch[1].trim(),
      sign: signMatch[1].trim(),
    };
  } catch (error) {
    console.error('Error en obtenerTokenYSign:', error);
    throw error;
  }
}

// Función para consultar último comprobante autorizado
async function consultarUltimoComprobante(
  token: string,
  sign: string,
  cuit: string,
  puntoVenta: number,
  tipoComprobante: number,
  ambiente: 'homologacion' | 'produccion'
): Promise<number> {
  try {
    const wsfeUrl = ambiente === 'produccion'
      ? 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
      : 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx';

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${puntoVenta}</ar:PtoVta>
      <ar:CbteTipo>${tipoComprobante}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(wsfeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
        'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado',
      },
      body: soapBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en WSFE: ${response.status}`);
    }

    const responseText = await response.text();
    
    // Parsear respuesta SOAP
    const cbteNroMatch = responseText.match(/<CbteNro>(\d+)<\/CbteNro>/);
    
    if (!cbteNroMatch) {
      console.error('Respuesta WSFE:', responseText);
      throw new Error('No se pudo extraer el número de comprobante de la respuesta');
    }

    return parseInt(cbteNroMatch[1], 10);
  } catch (error) {
    console.error('Error en consultarUltimoComprobante:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tipoComprobante } = await req.json();

    if (!tipoComprobante) {
      throw new Error('tipoComprobante es requerido');
    }

    console.log('Consultando último comprobante para tipo:', tipoComprobante);

    // Obtener configuración AFIP activa
    const { data: afipConfig, error: configError } = await supabase
      .from('afip_config')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !afipConfig) {
      throw new Error('No hay configuración AFIP activa');
    }

    if (!afipConfig.certificado_crt || !afipConfig.certificado_key) {
      throw new Error('Los certificados no están configurados');
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

    const codigoComprobante = tipoComprobanteMap[tipoComprobante];
    if (!codigoComprobante) {
      throw new Error(`Tipo de comprobante no válido: ${tipoComprobante}`);
    }

    // Obtener token y sign
    console.log('Obteniendo token y sign de WSAA...');
    const { token, sign } = await obtenerTokenYSign(
      afipConfig.certificado_crt,
      afipConfig.certificado_key,
      'wsfe',
      afipConfig.ambiente
    );

    // Consultar último comprobante
    console.log('Consultando último comprobante en WSFE...');
    const ultimoNumero = await consultarUltimoComprobante(
      token,
      sign,
      afipConfig.cuit_emisor,
      afipConfig.punto_venta,
      codigoComprobante,
      afipConfig.ambiente
    );

    console.log('Último número autorizado:', ultimoNumero);

    return new Response(
      JSON.stringify({
        success: true,
        ultimoNumero,
        puntoVenta: afipConfig.punto_venta,
        tipoComprobante,
        ambiente: afipConfig.ambiente,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error al consultar último comprobante:', error);
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
