import { useState, useMemo } from "react";
import { useProductosReport } from "@/hooks/useProductosReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Package, TrendingUp, AlertCircle, DollarSign, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ListadoProductos = () => {
  const { productos, stats, isLoading } = useProductosReport();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"todos" | "con-stock" | "sin-stock">("todos");
  const [sortBy, setSortBy] = useState<"descripcion" | "mas-vendido" | "valor-costo" | "valor-venta">("descripcion");

  // Filtrar y ordenar productos
  const productosFiltrados = useMemo(() => {
    let filtered = [...productos];

    // Filtro por descripción
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cod_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.marca?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por stock
    if (stockFilter === "con-stock") {
      filtered = filtered.filter(p => p.stock > 0);
    } else if (stockFilter === "sin-stock") {
      filtered = filtered.filter(p => p.stock === 0);
    }

    // Ordenamiento
    switch (sortBy) {
      case "mas-vendido":
        filtered.sort((a, b) => b.total_vendido - a.total_vendido);
        break;
      case "valor-costo":
        filtered.sort((a, b) => b.valor_stock_costo - a.valor_stock_costo);
        break;
      case "valor-venta":
        filtered.sort((a, b) => b.valor_stock_venta - a.valor_stock_venta);
        break;
      case "descripcion":
      default:
        filtered.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
        break;
    }

    return filtered;
  }, [productos, searchTerm, stockFilter, sortBy]);

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

        {/* Filtros y Ordenamiento */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Filtros y Ordenamiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por descripción, código o marca</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock-filter">Filtrar por stock</Label>
                <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
                  <SelectTrigger id="stock-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los productos</SelectItem>
                    <SelectItem value="con-stock">Con stock</SelectItem>
                    <SelectItem value="sin-stock">Sin stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-by">Ordenar por</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger id="sort-by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descripcion">Descripción A-Z</SelectItem>
                    <SelectItem value="mas-vendido">Más vendido</SelectItem>
                    <SelectItem value="valor-costo">Valor stock (Costo) ↓</SelectItem>
                    <SelectItem value="valor-venta">Valor stock (Venta) ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrando {productosFiltrados.length} de {productos.length} productos</span>
            </div>
          </CardContent>
        </Card>

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
                  {productosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        No se encontraron productos con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    productosFiltrados.map((producto) => (
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
                    ))
                  )}
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
