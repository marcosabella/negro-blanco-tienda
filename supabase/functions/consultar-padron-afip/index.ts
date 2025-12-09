import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import forge from 'https://esm.sh/node-forge@1.3.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Función para formatear fecha en formato AFIP (ISO 8601 con timezone Argentina)
function formatearFechaAFIP(fecha: Date): string {
  const argentinaOffset = -3 * 60 * 60 * 1000;
  const utcTime = fecha.getTime();
  const argentinaTime = new Date(utcTime + argentinaOffset);
  
  const year = argentinaTime.getUTCFullYear();
  const month = String(argentinaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(argentinaTime.getUTCDate()).padStart(2, '0');
  const hours = String(argentinaTime.getUTCHours()).padStart(2, '0');
  const minutes = String(argentinaTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(argentinaTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`;
}

// Crear TRA (Ticket de Requerimiento de Acceso) para el servicio ws_sr_padron_a5
function crearTRA(service: string): string {
  const ahora = new Date();
  const generationTime = new Date(ahora.getTime() - 10 * 60000);
  const expirationTime = new Date(ahora.getTime() + 10 * 60000);
  const uniqueId = Math.floor(Date.now() / 1000);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
<header>
<uniqueId>${uniqueId}</uniqueId>
<generationTime>${formatearFechaAFIP(generationTime)}</generationTime>
<expirationTime>${formatearFechaAFIP(expirationTime)}</expirationTime>
</header>
<service>${service}</service>
</loginTicketRequest>`;
}

// Firmar TRA usando PKCS#7/CMS con node-forge
function firmarTRA(tra: string, certPem: string, keyPem: string): string {
  try {
    console.log('Iniciando firma del TRA...');
    console.log('TRA a firmar:', tra);
    
    // Normalizar los saltos de línea en los certificados
    const certNormalized = certPem.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const keyNormalized = keyPem.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Parsear certificado y clave privada
    const certificate = forge.pki.certificateFromPem(certNormalized);
    const privateKey = forge.pki.privateKeyFromPem(keyNormalized);
    
    console.log('Certificado CN:', certificate.subject.getField('CN')?.value);
    console.log('Certificado válido hasta:', certificate.validity.notAfter);
    
    // Crear el mensaje PKCS#7 firmado
    const p7 = forge.pkcs7.createSignedData();
    
    // Agregar el contenido (TRA como bytes)
    p7.content = forge.util.createBuffer(tra, 'utf8');
    
    // Agregar el certificado del firmante
    p7.addCertificate(certificate);
    
    // Agregar el firmante con SHA-256
    p7.addSigner({
      key: privateKey,
      certificate: certificate,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data
        },
        {
          type: forge.pki.oids.messageDigest
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date()
        }
      ]
    });
    
    // Firmar
    p7.sign();
    
    console.log('TRA firmado correctamente');
    
    // Convertir a DER y luego a Base64
    const asn1 = p7.toAsn1();
    const der = forge.asn1.toDer(asn1);
    const cms = forge.util.encode64(der.getBytes());
    
    console.log('CMS generado, longitud:', cms.length);
    
    return cms;
  } catch (error) {
    console.error('Error al firmar TRA:', error);
    throw new Error(`Error al firmar TRA: ${error.message}`);
  }
}

// Obtener token y sign de WSAA
async function obtenerTokenYSign(
  certPem: string,
  keyPem: string,
  service: string,
  ambiente: 'homologacion' | 'produccion'
): Promise<{ token: string; sign: string }> {
  try {
    const tra = crearTRA(service);
    console.log('TRA creado');
    
    const cms = firmarTRA(tra, certPem, keyPem);
    
    const wsaaUrl = ambiente === 'produccion'
      ? 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
      : 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms';
    
    console.log('Enviando request a WSAA:', wsaaUrl);
    
    const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
<soapenv:Header/>
<soapenv:Body>
<wsaa:loginCms>
<wsaa:in0>${cms}</wsaa:in0>
</wsaa:loginCms>
</soapenv:Body>
</soapenv:Envelope>`;
    
    const response = await fetch(wsaaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: soapRequest,
    });

    const responseText = await response.text();
    console.log('Respuesta WSAA status:', response.status);
    console.log('Respuesta WSAA (primeros 500 chars):', responseText.substring(0, 500));
    
    if (!response.ok) {
      console.error('Error WSAA response completa:', responseText);
      throw new Error(`Error en WSAA: ${response.status} - ${responseText}`);
    }

    // Buscar el loginTicketResponse en la respuesta
    let xmlContent = responseText;
    
    // Si viene como CDATA, extraerlo
    const cdataMatch = responseText.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
    if (cdataMatch) {
      xmlContent = cdataMatch[1];
    }
    
    // También puede venir escapado en el return
    const returnMatch = responseText.match(/<loginCmsReturn[^>]*>([\s\S]*?)<\/loginCmsReturn>/);
    if (returnMatch) {
      xmlContent = returnMatch[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');
    }

    const tokenMatch = xmlContent.match(/<token>([\s\S]*?)<\/token>/);
    const signMatch = xmlContent.match(/<sign>([\s\S]*?)<\/sign>/);

    if (!tokenMatch || !signMatch) {
      console.error('No se encontró token/sign en:', xmlContent);
      throw new Error('No se pudo extraer token y sign de WSAA');
    }

    console.log('Token y sign obtenidos correctamente');
    
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

    const cuitEmisorLimpio = cuitEmisor.replace(/-/g, '');

    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:per="http://a5.soap.ws.server.puc.sr/">
  <soap:Header/>
  <soap:Body>
    <per:getPersona>
      <token>${token}</token>
      <sign>${sign}</sign>
      <cuitRepresentada>${cuitEmisorLimpio}</cuitRepresentada>
      <idPersona>${cuitConsultar}</idPersona>
    </per:getPersona>
  </soap:Body>
</soap:Envelope>`;

    console.log('Consultando padrón AFIP:', wsPadronUrl);
    console.log('CUIT a consultar:', cuitConsultar);

    const response = await fetch(wsPadronUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '',
      },
      body: soapBody,
    });

    const responseText = await response.text();
    console.log('Respuesta padrón status:', response.status);
    console.log('Respuesta padrón (primeros 1000 chars):', responseText.substring(0, 1000));

    if (!response.ok) {
      console.error('Error en ws_sr_padron_a5:', responseText);
      throw new Error(`Error en padrón AFIP: ${response.status}`);
    }

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
      numero: '',
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
        if (idImpuesto === 32 || idImpuesto === 30) {
          situacionAfip = 'Responsable Inscripto';
          break;
        }
        if (idImpuesto === 20) {
          situacionAfip = 'Monotributista';
        }
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

    console.log('=== INICIO CONSULTA PADRON AFIP ===');
    console.log('CUIT a consultar:', cuitLimpio);

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

    console.log('Config AFIP encontrada, ambiente:', afipConfig.ambiente);
    console.log('CUIT emisor:', afipConfig.cuit_emisor);

    // Obtener token y sign del WSAA para el servicio ws_sr_padron_a5
    console.log('Obteniendo token y sign de WSAA para ws_sr_padron_a5...');
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

    console.log('=== FIN CONSULTA PADRON AFIP ===');

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
