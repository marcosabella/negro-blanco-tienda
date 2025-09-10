export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bancos: {
        Row: {
          activo: boolean
          cbu: string
          created_at: string
          id: string
          nombre_banco: string
          numero_cuenta: string
          observaciones: string | null
          sucursal: string
          tipo_cuenta: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cbu: string
          created_at?: string
          id?: string
          nombre_banco: string
          numero_cuenta: string
          observaciones?: string | null
          sucursal: string
          tipo_cuenta?: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cbu?: string
          created_at?: string
          id?: string
          nombre_banco?: string
          numero_cuenta?: string
          observaciones?: string | null
          sucursal?: string
          tipo_cuenta?: Database["public"]["Enums"]["tipo_cuenta_bancaria"]
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          apellido: string
          calle: string
          codigo_postal: string
          created_at: string
          cuit: string
          email: string | null
          id: string
          ingresos_brutos: string | null
          localidad: string
          nombre: string
          numero: string
          provincia: string
          situacion_afip: string
          telefono: string | null
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          apellido: string
          calle: string
          codigo_postal: string
          created_at?: string
          cuit: string
          email?: string | null
          id?: string
          ingresos_brutos?: string | null
          localidad: string
          nombre: string
          numero: string
          provincia: string
          situacion_afip: string
          telefono?: string | null
          tipo_persona: string
          updated_at?: string
        }
        Update: {
          apellido?: string
          calle?: string
          codigo_postal?: string
          created_at?: string
          cuit?: string
          email?: string | null
          id?: string
          ingresos_brutos?: string | null
          localidad?: string
          nombre?: string
          numero?: string
          provincia?: string
          situacion_afip?: string
          telefono?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: []
      }
      cuenta_corriente: {
        Row: {
          cliente_id: string
          concepto: string
          created_at: string
          fecha_movimiento: string
          id: string
          monto: number
          observaciones: string | null
          tipo_movimiento: string
          updated_at: string
          venta_id: string | null
        }
        Insert: {
          cliente_id: string
          concepto: string
          created_at?: string
          fecha_movimiento?: string
          id?: string
          monto?: number
          observaciones?: string | null
          tipo_movimiento: string
          updated_at?: string
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string
          concepto?: string
          created_at?: string
          fecha_movimiento?: string
          id?: string
          monto?: number
          observaciones?: string | null
          tipo_movimiento?: string
          updated_at?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cuenta_corriente_cliente"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cuenta_corriente_venta"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          cod_barras: string | null
          cod_producto: string
          created_at: string
          descripcion: string
          id: string
          marca_id: string
          observaciones: string | null
          porcentaje_descuento: number
          porcentaje_iva: number
          porcentaje_utilidad: number
          precio_costo: number
          precio_venta: number | null
          proveedor_id: string
          rubro_id: string
          stock: number
          subrubro_id: string
          tipo_moneda: Database["public"]["Enums"]["tipo_moneda"]
          updated_at: string
        }
        Insert: {
          cod_barras?: string | null
          cod_producto: string
          created_at?: string
          descripcion: string
          id?: string
          marca_id: string
          observaciones?: string | null
          porcentaje_descuento?: number
          porcentaje_iva?: number
          porcentaje_utilidad?: number
          precio_costo?: number
          precio_venta?: number | null
          proveedor_id: string
          rubro_id: string
          stock?: number
          subrubro_id: string
          tipo_moneda?: Database["public"]["Enums"]["tipo_moneda"]
          updated_at?: string
        }
        Update: {
          cod_barras?: string | null
          cod_producto?: string
          created_at?: string
          descripcion?: string
          id?: string
          marca_id?: string
          observaciones?: string | null
          porcentaje_descuento?: number
          porcentaje_iva?: number
          porcentaje_utilidad?: number
          precio_costo?: number
          precio_venta?: number | null
          proveedor_id?: string
          rubro_id?: string
          stock?: number
          subrubro_id?: string
          tipo_moneda?: Database["public"]["Enums"]["tipo_moneda"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_subrubro_id_fkey"
            columns: ["subrubro_id"]
            isOneToOne: false
            referencedRelation: "subrubros"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          apellido: string | null
          calle: string
          codigo_postal: string
          created_at: string
          cuit: string
          email: string | null
          id: string
          ingresos_brutos: string | null
          localidad: string
          nombre: string
          numero: string
          provincia: string
          razon_social: string | null
          situacion_afip: string
          telefono: string | null
          tipo_persona: string
          updated_at: string
        }
        Insert: {
          apellido?: string | null
          calle: string
          codigo_postal: string
          created_at?: string
          cuit: string
          email?: string | null
          id?: string
          ingresos_brutos?: string | null
          localidad: string
          nombre: string
          numero: string
          provincia: string
          razon_social?: string | null
          situacion_afip: string
          telefono?: string | null
          tipo_persona: string
          updated_at?: string
        }
        Update: {
          apellido?: string | null
          calle?: string
          codigo_postal?: string
          created_at?: string
          cuit?: string
          email?: string | null
          id?: string
          ingresos_brutos?: string | null
          localidad?: string
          nombre?: string
          numero?: string
          provincia?: string
          razon_social?: string | null
          situacion_afip?: string
          telefono?: string | null
          tipo_persona?: string
          updated_at?: string
        }
        Relationships: []
      }
      rubros: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      subrubros: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          rubro_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          rubro_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          rubro_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subrubros_rubro_id_fkey"
            columns: ["rubro_id"]
            isOneToOne: false
            referencedRelation: "rubros"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          monto_iva: number
          porcentaje_iva: number
          precio_unitario: number
          producto_id: string
          subtotal: number
          total: number
          updated_at: string
          venta_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          monto_iva?: number
          porcentaje_iva?: number
          precio_unitario: number
          producto_id: string
          subtotal?: number
          total?: number
          updated_at?: string
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          monto_iva?: number
          porcentaje_iva?: number
          precio_unitario?: number
          producto_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          banco_id: string | null
          cliente_id: string | null
          cliente_nombre: string | null
          created_at: string
          fecha_venta: string
          id: string
          numero_comprobante: string
          observaciones: string | null
          subtotal: number
          tipo_comprobante: Database["public"]["Enums"]["tipo_comprobante"]
          tipo_pago: Database["public"]["Enums"]["tipo_pago"]
          total: number
          total_iva: number
          updated_at: string
        }
        Insert: {
          banco_id?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          fecha_venta?: string
          id?: string
          numero_comprobante: string
          observaciones?: string | null
          subtotal?: number
          tipo_comprobante?: Database["public"]["Enums"]["tipo_comprobante"]
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"]
          total?: number
          total_iva?: number
          updated_at?: string
        }
        Update: {
          banco_id?: string | null
          cliente_id?: string | null
          cliente_nombre?: string | null
          created_at?: string
          fecha_venta?: string
          id?: string
          numero_comprobante?: string
          observaciones?: string | null
          subtotal?: number
          tipo_comprobante?: Database["public"]["Enums"]["tipo_comprobante"]
          tipo_pago?: Database["public"]["Enums"]["tipo_pago"]
          total?: number
          total_iva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_comprobante:
        | "factura_a"
        | "factura_b"
        | "factura_c"
        | "nota_credito_a"
        | "nota_credito_b"
        | "nota_credito_c"
        | "nota_debito_a"
        | "nota_debito_b"
        | "nota_debito_c"
        | "recibo_a"
        | "recibo_b"
        | "recibo_c"
        | "ticket_fiscal"
        | "factura_exportacion"
      tipo_cuenta_bancaria:
        | "CA_PESOS"
        | "CA_USD"
        | "CC_PESOS"
        | "CC_USD"
        | "CAJA_AHORRO"
        | "CUENTA_SUELDO"
      tipo_moneda: "ARS" | "USD" | "USD_BLUE"
      tipo_pago: "contado" | "transferencia" | "tarjeta" | "cheque" | "cta_cte"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_comprobante: [
        "factura_a",
        "factura_b",
        "factura_c",
        "nota_credito_a",
        "nota_credito_b",
        "nota_credito_c",
        "nota_debito_a",
        "nota_debito_b",
        "nota_debito_c",
        "recibo_a",
        "recibo_b",
        "recibo_c",
        "ticket_fiscal",
        "factura_exportacion",
      ],
      tipo_cuenta_bancaria: [
        "CA_PESOS",
        "CA_USD",
        "CC_PESOS",
        "CC_USD",
        "CAJA_AHORRO",
        "CUENTA_SUELDO",
      ],
      tipo_moneda: ["ARS", "USD", "USD_BLUE"],
      tipo_pago: ["contado", "transferencia", "tarjeta", "cheque", "cta_cte"],
    },
  },
} as const
