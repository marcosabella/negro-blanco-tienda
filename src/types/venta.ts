export interface PagoVenta {
  id?: string;
  venta_id?: string;
  tipo_pago: TipoPago;
  monto: number;
  banco_id?: string;
  tarjeta_id?: string;
  cuotas?: number;
  recargo_cuotas?: number;
  cheque_id?: string;
  created_at?: string;
  updated_at?: string;
  banco?: {
    nombre_banco: string;
  };
  tarjeta?: {
    nombre: string;
  };
  cheque?: {
    numero_cheque: string;
    monto: number;
    banco_emisor: string;
  };
}

export interface Venta {
  id?: string;
  numero_comprobante: string;
  fecha_venta: string;
  tipo_pago: TipoPago;
  tipo_comprobante: TipoComprobante;
  cliente_id?: string;
  cliente_nombre: string;
  banco_id?: string;
  tarjeta_id?: string;
  cuotas?: number;
  recargo_cuotas?: number;
  subtotal: number;
  total_iva: number;
  total: number;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  cliente?: {
    nombre: string;
    apellido: string;
  };
  banco?: {
    nombre_banco: string;
    numero_cuenta: string;
  };
  tarjeta?: {
    nombre: string;
  }
  venta_items?: VentaItem[];
  pagos_venta?: PagoVenta[];
}

export interface VentaItem {
  id?: string;
  venta_id?: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  porcentaje_iva: number;
  monto_iva: number;
  subtotal: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  producto?: {
    cod_producto: string;
    descripcion: string;
    precio_venta: number;
    porcentaje_iva: number;
  };
}

export type TipoPago = 'contado' | 'transferencia' | 'tarjeta' | 'cheque' | 'cta_cte';

export type TipoComprobante = 
  | 'factura_a'
  | 'factura_b'
  | 'factura_c'
  | 'nota_credito_a'
  | 'nota_credito_b'
  | 'nota_credito_c'
  | 'nota_debito_a'
  | 'nota_debito_b'
  | 'nota_debito_c'
  | 'recibo_a'
  | 'recibo_b'
  | 'recibo_c'
  | 'ticket_fiscal'
  | 'factura_exportacion';

export const TIPOS_PAGO: { value: TipoPago; label: string }[] = [
  { value: 'contado', label: 'Contado' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cta_cte', label: 'Cuenta Corriente' },
];

export const TIPOS_COMPROBANTE: { value: TipoComprobante; label: string }[] = [
  { value: 'ticket_fiscal', label: 'Ticket Fiscal' },
  { value: 'factura_a', label: 'Factura A' },
  { value: 'factura_b', label: 'Factura B' },
  { value: 'factura_c', label: 'Factura C' },
  { value: 'nota_credito_a', label: 'Nota de Crédito A' },
  { value: 'nota_credito_b', label: 'Nota de Crédito B' },
  { value: 'nota_credito_c', label: 'Nota de Crédito C' },
  { value: 'nota_debito_a', label: 'Nota de Débito A' },
  { value: 'nota_debito_b', label: 'Nota de Débito B' },
  { value: 'nota_debito_c', label: 'Nota de Débito C' },
  { value: 'recibo_a', label: 'Recibo A' },
  { value: 'recibo_b', label: 'Recibo B' },
  { value: 'recibo_c', label: 'Recibo C' },
  { value: 'factura_exportacion', label: 'Factura de Exportación' },
];