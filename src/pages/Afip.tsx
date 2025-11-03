import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAfipConfig } from '@/hooks/useAfipConfig';
import { FileKey, CheckCircle, XCircle, Upload, AlertCircle } from 'lucide-react';

const Afip = () => {
  const { config, isLoading, createOrUpdate, isCreatingOrUpdating } = useAfipConfig();
  const [puntoVenta, setPuntoVenta] = useState('');
  const [cuitEmisor, setCuitEmisor] = useState('');
  const [ambiente, setAmbiente] = useState<'produccion' | 'homologacion'>('homologacion');
  const [certificadoCrt, setCertificadoCrt] = useState<string | null>(null);
  const [claveKey, setClaveKey] = useState<string | null>(null);
  const [certificadoFileName, setCertificadoFileName] = useState<string>('');
  const [claveFileName, setClaveFileName] = useState<string>('');
  const [certificadoError, setCertificadoError] = useState<string>('');
  const [claveError, setClaveError] = useState<string>('');

  useEffect(() => {
    if (config) {
      setPuntoVenta(config.punto_venta.toString());
      setCuitEmisor(config.cuit_emisor);
      setAmbiente(config.ambiente);
      setCertificadoCrt(config.certificado_crt);
      setClaveKey(config.clave_key);
      if (config.certificado_crt) setCertificadoFileName('Certificado (.crt) cargado');
      if (config.clave_key) setClaveFileName('Clave (.key) cargada');
    }
  }, [config]);

  const handleCertificadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCertificadoError('');

    if (!file) return;

    if (!file.name.endsWith('.crt')) {
      setCertificadoError('El archivo debe ser de tipo .crt');
      return;
    }

    if (file.size > 50 * 1024) {
      setCertificadoError('El certificado no puede superar 50 KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCertificadoCrt(content);
      setCertificadoFileName(file.name);
    };
    reader.onerror = () => {
      setCertificadoError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  const handleClaveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setClaveError('');

    if (!file) return;

    if (!file.name.endsWith('.key')) {
      setClaveError('El archivo debe ser de tipo .key');
      return;
    }

    if (file.size > 50 * 1024) {
      setClaveError('La clave no puede superar 50 KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setClaveKey(content);
      setClaveFileName(file.name);
    };
    reader.onerror = () => {
      setClaveError('Error al leer el archivo');
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!puntoVenta || !cuitEmisor) {
      return;
    }

    createOrUpdate({
      punto_venta: parseInt(puntoVenta),
      cuit_emisor: cuitEmisor,
      ambiente,
      certificado_crt: certificadoCrt,
      clave_key: claveKey,
      activo: true,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Cargando configuración AFIP...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuración AFIP</h1>
        <p className="text-muted-foreground">
          Configure los parámetros para facturación electrónica
        </p>
      </div>

      <div className="grid gap-6">
        {config && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileKey className="h-5 w-5" />
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">Punto de Venta</span>
                    <span className="text-xs text-muted-foreground">Número de punto de venta asignado por AFIP</span>
                  </div>
                  <Badge variant="outline" className="text-lg">{config.punto_venta}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">CUIT</span>
                    <span className="text-xs text-muted-foreground">CUIT del comercio emisor</span>
                  </div>
                  <Badge variant="outline">{config.cuit_emisor}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">Ambiente</span>
                    <span className="text-xs text-muted-foreground">Entorno de facturación electrónica</span>
                  </div>
                  <Badge variant={config.ambiente === 'produccion' ? 'default' : 'secondary'}>
                    {config.ambiente === 'produccion' ? 'Producción' : 'Homologación (Testing)'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">Certificado Digital (.crt)</span>
                    <span className="text-xs text-muted-foreground">Archivo de certificado AFIP</span>
                  </div>
                  {config.certificado_crt ? (
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cargado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 bg-orange-50">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">Clave Privada (.key)</span>
                    <span className="text-xs text-muted-foreground">Archivo de clave privada</span>
                  </div>
                  {config.clave_key ? (
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cargada
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 bg-orange-50">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <span className="text-sm font-medium block">Estado</span>
                    <span className="text-xs text-muted-foreground">Configuración activa/inactiva</span>
                  </div>
                  <Badge variant={config.activo ? 'default' : 'secondary'}>
                    {config.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configurar AFIP</CardTitle>
            <CardDescription>
              Complete los datos para la facturación electrónica con AFIP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Los certificados digitales deben ser obtenidos desde el sitio de AFIP. Para más información,
                visite <a href="https://www.afip.gob.ar" target="_blank" rel="noopener noreferrer" className="font-semibold underline">www.afip.gob.ar</a>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="puntoVenta">Punto de Venta *</Label>
                  <Input
                    id="puntoVenta"
                    type="number"
                    placeholder="Ej: 1"
                    value={puntoVenta}
                    onChange={(e) => setPuntoVenta(e.target.value)}
                    required
                    min="1"
                    max="9999"
                    className="font-semibold"
                  />
                  <p className="text-sm text-muted-foreground">
                    Número de punto de venta asignado por AFIP
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuitEmisor">CUIT Emisor *</Label>
                  <Input
                    id="cuitEmisor"
                    type="text"
                    placeholder="XX-XXXXXXXX-X"
                    value={cuitEmisor}
                    onChange={(e) => setCuitEmisor(e.target.value)}
                    required
                    maxLength={13}
                    className="font-semibold"
                  />
                  <p className="text-sm text-muted-foreground">
                    CUIT del comercio emisor de facturas (formato: XX-XXXXXXXX-X)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ambiente">Ambiente *</Label>
                  <Select value={ambiente} onValueChange={(value: 'produccion' | 'homologacion') => setAmbiente(value)}>
                    <SelectTrigger id="ambiente">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homologacion">Homologación (Testing)</SelectItem>
                      <SelectItem value="produccion">Producción</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Use homologación para pruebas y producción para facturas reales
                  </p>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Certificados Digitales
                  </h3>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="certificado">
                        Certificado Digital (.crt) *
                        {certificadoCrt && (
                          <Badge variant="outline" className="ml-2 text-green-600 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {certificadoFileName}
                          </Badge>
                        )}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="certificado"
                          type="file"
                          accept=".crt"
                          onChange={handleCertificadoUpload}
                          className="flex-1"
                        />
                      </div>
                      {certificadoError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {certificadoError}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Archivo de certificado obtenido desde AFIP (máx. 50 KB)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clave">
                        Clave Privada (.key) *
                        {claveKey && (
                          <Badge variant="outline" className="ml-2 text-green-600 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {claveFileName}
                          </Badge>
                        )}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="clave"
                          type="file"
                          accept=".key"
                          onChange={handleClaveUpload}
                          className="flex-1"
                        />
                      </div>
                      {claveError && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {claveError}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Archivo de clave privada correspondiente al certificado (máx. 50 KB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Asegúrese de que los archivos .crt y .key correspondan al mismo certificado y CUIT.
                  Los certificados tienen fecha de vencimiento que debe ser renovada periódicamente.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="submit" disabled={isCreatingOrUpdating || !puntoVenta || !cuitEmisor}>
                  {isCreatingOrUpdating ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Afip;
