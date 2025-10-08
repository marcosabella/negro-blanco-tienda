export interface AfipConfig {
  id: string;
  punto_venta: number;
  cuit_emisor: string;
  ambiente: 'produccion' | 'homologacion';
  certificado_crt: string | null;
  clave_key: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AfipConfigInsert {
  punto_venta: number;
  cuit_emisor: string;
  ambiente: 'produccion' | 'homologacion';
  certificado_crt?: string | null;
  clave_key?: string | null;
  activo?: boolean;
}

export interface AfipConfigUpdate {
  punto_venta?: number;
  cuit_emisor?: string;
  ambiente?: 'produccion' | 'homologacion';
  certificado_crt?: string | null;
  clave_key?: string | null;
  activo?: boolean;
}
