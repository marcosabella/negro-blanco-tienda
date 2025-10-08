import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Producto } from "@/types/producto";

interface ProductoConVentas extends Producto {
  total_vendido: number;
  ultima_venta: string | null;
  valor_stock_costo: number;
  valor_stock_venta: number;
}

interface ProductStats {
  totalProductos: number;
  productosSinStock: number;
  valorTotalStockCosto: number;
  valorTotalStockVenta: number;
  productoMasVendido: ProductoConVentas | null;
}

export const useProductosReport = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["productos-report"],
    queryFn: async () => {
      // Obtener todos los productos con sus relaciones
      const { data: productos, error: prodError } = await supabase
        .from("productos")
        .select(`
          *,
          proveedor:proveedores(nombre, apellido, razon_social),
          marca:marcas(nombre),
          rubro:rubros(nombre),
          subrubro:subrubros(nombre)
        `)
        .order("descripcion");

      if (prodError) throw prodError;

      // Obtener datos de ventas agrupados por producto
      const { data: ventasData, error: ventasError } = await supabase
        .from("venta_items")
        .select(`
          producto_id,
          cantidad,
          venta:ventas(fecha_venta)
        `);

      if (ventasError) throw ventasError;

      // Procesar datos para calcular estadísticas
      const ventasPorProducto = ventasData.reduce((acc: any, item: any) => {
        if (!acc[item.producto_id]) {
          acc[item.producto_id] = {
            total: 0,
            ultimaVenta: null,
          };
        }
        acc[item.producto_id].total += item.cantidad;
        
        if (item.venta?.fecha_venta) {
          if (!acc[item.producto_id].ultimaVenta || 
              new Date(item.venta.fecha_venta) > new Date(acc[item.producto_id].ultimaVenta)) {
            acc[item.producto_id].ultimaVenta = item.venta.fecha_venta;
          }
        }
        
        return acc;
      }, {});

      // Combinar datos de productos con ventas
      const productosConVentas: ProductoConVentas[] = (productos || []).map((producto) => {
        const ventasInfo = ventasPorProducto[producto.id] || { total: 0, ultimaVenta: null };
        return {
          ...producto,
          total_vendido: ventasInfo.total,
          ultima_venta: ventasInfo.ultimaVenta,
          valor_stock_costo: producto.stock * producto.precio_costo,
          valor_stock_venta: producto.stock * (producto.precio_venta || 0),
        };
      });

      // Calcular estadísticas
      const stats: ProductStats = {
        totalProductos: productosConVentas.length,
        productosSinStock: productosConVentas.filter(p => p.stock === 0).length,
        valorTotalStockCosto: productosConVentas.reduce((sum, p) => sum + p.valor_stock_costo, 0),
        valorTotalStockVenta: productosConVentas.reduce((sum, p) => sum + p.valor_stock_venta, 0),
        productoMasVendido: productosConVentas.reduce((max, p) => 
          !max || p.total_vendido > max.total_vendido ? p : max
        , null as ProductoConVentas | null),
      };

      return {
        productos: productosConVentas,
        stats,
      };
    },
  });

  return {
    productos: data?.productos || [],
    stats: data?.stats,
    isLoading,
    error,
  };
};
