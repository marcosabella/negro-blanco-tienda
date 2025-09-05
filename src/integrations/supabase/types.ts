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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      tipo_moneda: "ARS" | "USD" | "USD_BLUE"
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
      tipo_moneda: ["ARS", "USD", "USD_BLUE"],
    },
  },
} as const
