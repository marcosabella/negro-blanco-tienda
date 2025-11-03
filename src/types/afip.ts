export interface AfipConfig {
  id?: string;
  punto_venta: number;
  cuit_emisor: string;
  ambiente: 'homologacion' | 'produccion';
  certificado_crt?: string;
  certificado_key?: string;
  nombre_certificado_crt?: string;
  nombre_certificado_key?: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AfipConfigInsert = Omit<AfipConfig, 'id' | 'created_at' | 'updated_at'>;
export type AfipConfigUpdate = Partial<AfipConfigInsert>;

export const AMBIENTES_AFIP = [
  { value: 'homologacion', label: 'Homologación (Testing)' },
  { value: 'produccion', label: 'Producción' },
] as const;
