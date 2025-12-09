import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Crear TRA (Ticket de Requerimiento de Acceso) para el servicio ws_sr_padron_a5
function crearTRA(service: string): string {
  const ahora = new Date();
  const generationTime = new Date(ahora.getTime() - 10 * 60000); // 10 minutos atrás
  const expirationTime = new Date(ahora.getTime() + 10 * 60000); // 10 minutos adelante
  
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

// Firmar TRA con certificado (simplificado - envía directo a WSAA)
async function obtenerTokenYSign(
  certPem: string,
  keyPem: string,
  service: string,
  ambiente: 'homologacion' | 'produccion'
): Promise<{ token: string; sign: string }> {
  try {
    console.log('Creando TRA para servicio:', service);
    const tra = crearTRA(service);
    
    // Importar la clave privada
    const keyData = keyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace('-----BEGIN RSA PRIVATE KEY-----', '')
      .replace('-----END RSA PRIVATE KEY-----', '')
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

    // Firmar el TRA
    const encoder = new TextEncoder();
    const data = encoder.encode(tra);
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      data
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Extraer el certificado sin headers
    const certData = certPem
      .replace('-----BEGIN CERTIFICATE-----', '')
      .replace('-----END CERTIFICATE-----', '')
      .replace(/\s/g, '');

    // Crear envelope SOAP para WSAA
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0><![CDATA[${btoa(tra)}]]></wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`;

    // URL del WSAA según ambiente
    const wsaaUrl = ambiente === 'produccion'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    
    console.log('Llamando a WSAA:', wsaaUrl);
    
    const response = await fetch(wsaaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: soapEnvelope,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en WSAA:', response.status, errorText);
      throw new Error(`Error en WSAA: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Respuesta WSAA recibida');

    // Parsear respuesta para extraer token y sign
    const tokenMatch = responseText.match(/<token>(.*?)<\/token>/s);
    const signMatch = responseText.match(/<sign>(.*?)<\/sign>/s);

    if (!tokenMatch || !signMatch) {
      console.error('Respuesta WSAA:', responseText);
      throw new Error('No se pudo extraer token/sign de WSAA');
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

// Consultar padrón AFIP (ws_sr_padron_a5)
async function consultarPadron(
  token: string,
  sign: string,
  cuitEmisor: string,
  cuitConsultar: string,
  ambiente: 'homologacion' | 'produccion'
): Promise<any> {
  try {
    const wsPadronUrl = ambiente === 'produccion'
      ? 'https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5'
      : 'https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5';

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:per="http://a5.soap.ws.server.puc.sr/">
  <soap:Header/>
  <soap:Body>
    <per:getPersona>
      <token>${token}</token>
      <sign>${sign}</sign>
      <cuitRepresentada>${cuitEmisor}</cuitRepresentada>
      <idPersona>${cuitConsultar}</idPersona>
    </per:getPersona>
  </soap:Body>
</soap:Envelope>`;

    console.log('Consultando padrón AFIP para CUIT:', cuitConsultar);

    const response = await fetch(wsPadronUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: soapBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en ws_sr_padron_a5:', response.status, errorText);
      throw new Error(`Error en padrón AFIP: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Respuesta del padrón recibida');

    return parseRespuestaPadron(responseText);
  } catch (error) {
    console.error('Error en consultarPadron:', error);
    throw error;
  }
}

// Parsear respuesta XML del padrón AFIP
function parseRespuestaPadron(xml: string): any {
  console.log('Parseando respuesta del padrón...');
  
  // Extraer datos de persona
  const tipoPersonaMatch = xml.match(/<tipoPersona>(.*?)<\/tipoPersona>/);
  const nombreMatch = xml.match(/<nombre>(.*?)<\/nombre>/);
  const apellidoMatch = xml.match(/<apellido>(.*?)<\/apellido>/);
  const razonSocialMatch = xml.match(/<razonSocial>(.*?)<\/razonSocial>/);
  
  // Domicilio fiscal
  const domicilioSection = xml.match(/<domicilioFiscal>(.*?)<\/domicilioFiscal>/s);
  let domicilio: any = {};
  
  if (domicilioSection) {
    const domXml = domicilioSection[1];
    const calleMatch = domXml.match(/<direccion>(.*?)<\/direccion>/);
    const localidadMatch = domXml.match(/<localidad>(.*?)<\/localidad>/);
    const provinciaMatch = domXml.match(/<descripcionProvincia>(.*?)<\/descripcionProvincia>/);
    const cpMatch = domXml.match(/<codPostal>(.*?)<\/codPostal>/);
    
    domicilio = {
      calle: calleMatch ? calleMatch[1] : '',
      numero: '', // La dirección completa viene en 'direccion'
      localidad: localidadMatch ? localidadMatch[1] : '',
      provincia: provinciaMatch ? mapearProvincia(provinciaMatch[1]) : '',
      codigoPostal: cpMatch ? cpMatch[1] : '',
    };
    
    // Intentar separar calle y número
    if (calleMatch) {
      const direccion = calleMatch[1];
      const match = direccion.match(/^(.+?)\s+(\d+)$/);
      if (match) {
        domicilio.calle = match[1].trim();
        domicilio.numero = match[2];
      } else {
        domicilio.calle = direccion;
        domicilio.numero = 'S/N';
      }
    }
  }

  // Condición IVA / Situación AFIP
  const impuestosSection = xml.match(/<impuesto>(.*?)<\/impuesto>/gs);
  let situacionAfip = 'Consumidor Final';
  
  if (impuestosSection) {
    for (const imp of impuestosSection) {
      const idImpMatch = imp.match(/<idImpuesto>(\d+)<\/idImpuesto>/);
      const estadoMatch = imp.match(/<estado>(\w+)<\/estado>/);
      
      if (idImpMatch && estadoMatch && estadoMatch[1] === 'ACTIVO') {
        const idImpuesto = parseInt(idImpMatch[1]);
        // 32 = IVA, 30 = Responsable Inscripto
        if (idImpuesto === 32 || idImpuesto === 30) {
          situacionAfip = 'Responsable Inscripto';
          break;
        }
        // 20 = Monotributo
        if (idImpuesto === 20) {
          situacionAfip = 'Monotributista';
        }
        // 34 = Exento
        if (idImpuesto === 34) {
          situacionAfip = 'Exento';
        }
      }
    }
  }

  // Categoría monotributo
  const categoriaMonoMatch = xml.match(/<categoriaMonotributo>(.*?)<\/categoriaMonotributo>/);
  if (categoriaMonoMatch && situacionAfip === 'Monotributista') {
    situacionAfip = `Monotributista Cat. ${categoriaMonoMatch[1]}`;
  }

  const tipoPersona = tipoPersonaMatch?.[1] || '';
  const esPersonaFisica = tipoPersona === 'FISICA';

  const resultado = {
    nombre: esPersonaFisica 
      ? (nombreMatch?.[1] || '') 
      : (razonSocialMatch?.[1] || nombreMatch?.[1] || ''),
    apellido: esPersonaFisica ? (apellidoMatch?.[1] || '') : '',
    razonSocial: razonSocialMatch?.[1] || '',
    tipoPersona: esPersonaFisica ? 'fisica' : 'juridica',
    situacionAfip,
    domicilioFiscal: domicilio,
  };

  console.log('Datos parseados:', JSON.stringify(resultado, null, 2));
  return resultado;
}

// Mapear nombre de provincia AFIP a formato estándar
function mapearProvincia(provinciaAfip: string): string {
  const mapeo: Record<string, string> = {
    'CIUDAD AUTONOMA BUENOS AIRES': 'Ciudad Autónoma de Buenos Aires',
    'BUENOS AIRES': 'Buenos Aires',
    'CATAMARCA': 'Catamarca',
    'CHACO': 'Chaco',
    'CHUBUT': 'Chubut',
    'CORDOBA': 'Córdoba',
    'CORRIENTES': 'Corrientes',
    'ENTRE RIOS': 'Entre Ríos',
    'FORMOSA': 'Formosa',
    'JUJUY': 'Jujuy',
    'LA PAMPA': 'La Pampa',
    'LA RIOJA': 'La Rioja',
    'MENDOZA': 'Mendoza',
    'MISIONES': 'Misiones',
    'NEUQUEN': 'Neuquén',
    'RIO NEGRO': 'Río Negro',
    'SALTA': 'Salta',
    'SAN JUAN': 'San Juan',
    'SAN LUIS': 'San Luis',
    'SANTA CRUZ': 'Santa Cruz',
    'SANTA FE': 'Santa Fe',
    'SANTIAGO DEL ESTERO': 'Santiago del Estero',
    'TIERRA DEL FUEGO': 'Tierra del Fuego',
    'TUCUMAN': 'Tucumán',
  };
  
  const upper = provinciaAfip.toUpperCase();
  return mapeo[upper] || provinciaAfip;
}

// Detectar tipo de persona por prefijo del CUIT
function detectarTipoPersona(cuit: string): 'fisica' | 'juridica' {
  const prefijo = cuit.substring(0, 2);
  return ['30', '33', '34'].includes(prefijo) ? 'juridica' : 'fisica';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { cuit } = await req.json();

    if (!cuit) {
      throw new Error('CUIT es requerido');
    }

    // Limpiar CUIT (quitar guiones y espacios)
    const cuitLimpio = cuit.replace(/[-\s]/g, '');
    
    if (cuitLimpio.length !== 11) {
      throw new Error('El CUIT debe tener 11 dígitos');
    }

    console.log('Consultando padrón AFIP para CUIT:', cuitLimpio);

    // Obtener configuración AFIP activa
    const { data: afipConfig, error: configError } = await supabase
      .from('afip_config')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !afipConfig) {
      console.error('No hay configuración AFIP activa');
      const tipoPersona = detectarTipoPersona(cuitLimpio);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No hay configuración AFIP activa. Configure el módulo AFIP primero.',
          tipoPersona,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validar certificados
    if (!afipConfig.certificado_crt || !afipConfig.certificado_key) {
      console.error('Certificados no configurados');
      const tipoPersona = detectarTipoPersona(cuitLimpio);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Los certificados AFIP no están configurados. Cargue el certificado y clave privada.',
          tipoPersona,
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Configuración AFIP encontrada:', {
      cuit_emisor: afipConfig.cuit_emisor,
      ambiente: afipConfig.ambiente,
    });

    // Obtener token y sign del WSAA para el servicio ws_sr_padron_a5
    const { token, sign } = await obtenerTokenYSign(
      afipConfig.certificado_crt,
      afipConfig.certificado_key,
      'ws_sr_padron_a5',
      afipConfig.ambiente
    );

    console.log('Token y Sign obtenidos para ws_sr_padron_a5');

    // Consultar el padrón
    const datosPersona = await consultarPadron(
      token,
      sign,
      afipConfig.cuit_emisor,
      cuitLimpio,
      afipConfig.ambiente
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: datosPersona,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error en consultar-padron-afip:', error);
    
    // Intentar detectar tipo de persona aunque falle la consulta
    let tipoPersona: 'fisica' | 'juridica' = 'fisica';
    try {
      const body = await req.clone().json();
      if (body.cuit) {
        const cuitLimpio = body.cuit.replace(/[-\s]/g, '');
        tipoPersona = detectarTipoPersona(cuitLimpio);
      }
    } catch {}

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Error al consultar el padrón AFIP',
        tipoPersona,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
