import { useProductosReport } from "@/hooks/useProductosReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Printer, Package, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ListadoProductos = () => {
  const { productos, stats, isLoading } = useProductosReport();

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Listado de Productos</h1>
            <p className="text-muted-foreground">
              Reporte completo del inventario de productos
            </p>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir Reporte
          </Button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold mb-2">Reporte de Productos</h1>
          <p className="text-sm text-muted-foreground">
            Generado el {format(new Date(), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProductos || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sin Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats?.productosSinStock || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Más Vendido</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium truncate">
                {stats?.productoMasVendido?.descripcion || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.productoMasVendido?.total_vendido || 0} unidades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Stock (Costo)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatCurrency(stats?.valorTotalStockCosto || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Stock (Venta)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatCurrency(stats?.valorTotalStockVenta || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Rubro</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">P. Costo</TableHead>
                    <TableHead className="text-right">P. Venta</TableHead>
                    <TableHead className="text-right">Valor Stock (Costo)</TableHead>
                    <TableHead className="text-right">Valor Stock (Venta)</TableHead>
                    <TableHead className="text-right">Vendidas</TableHead>
                    <TableHead>Última Venta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map((producto) => (
                    <TableRow key={producto.id}>
                      <TableCell className="font-medium">{producto.cod_producto}</TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>{producto.marca?.nombre || "-"}</TableCell>
                      <TableCell>{producto.rubro?.nombre || "-"}</TableCell>
                      <TableCell className="text-right">
                        {producto.stock === 0 ? (
                          <Badge variant="destructive">Sin stock</Badge>
                        ) : (
                          producto.stock
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(producto.precio_costo)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(producto.precio_venta || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(producto.valor_stock_costo)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(producto.valor_stock_venta)}
                      </TableCell>
                      <TableCell className="text-right">
                        {producto.total_vendido > 0 ? (
                          <Badge variant="outline">{producto.total_vendido}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {producto.ultima_venta ? (
                          format(new Date(producto.ultima_venta), "dd/MM/yyyy", { locale: es })
                        ) : (
                          <span className="text-muted-foreground">Sin ventas</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-6, .p-6 * {
            visibility: visible;
          }
          .p-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ListadoProductos;
