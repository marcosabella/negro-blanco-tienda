import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, ShoppingCart, DollarSign, CircleAlert as AlertCircle, Printer } from "lucide-react";
import { Cliente } from "@/types/cliente";
import { format, subMonths, subYears, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface InformeClienteProps {
  cliente: Cliente;
}

type PeriodoType = "mes_actual" | "mes_anterior" | "ultimos_3_meses" | "ultimos_6_meses" | "anio_actual" | "historico";

export function InformeCliente({ cliente }: InformeClienteProps) {
  const [periodo, setPeriodo] = useState<PeriodoType>("mes_actual");

  const getFechaRango = () => {
    const hoy = new Date();
    switch (periodo) {
      case "mes_actual":
        return { desde: startOfMonth(hoy), hasta: endOfMonth(hoy) };
      case "mes_anterior":
        const mesAnterior = subMonths(hoy, 1);
        return { desde: startOfMonth(mesAnterior), hasta: endOfMonth(mesAnterior) };
      case "ultimos_3_meses":
        return { desde: subMonths(hoy, 3), hasta: hoy };
      case "ultimos_6_meses":
        return { desde: subMonths(hoy, 6), hasta: hoy };
      case "anio_actual":
        return { desde: new Date(hoy.getFullYear(), 0, 1), hasta: hoy };
      case "historico":
        return { desde: new Date(2000, 0, 1), hasta: hoy };
      default:
        return { desde: startOfMonth(hoy), hasta: endOfMonth(hoy) };
    }
  };

  const rango = getFechaRango();

  const estadisticas = useMemo(() => {
    return {
      saldoCuentaCorriente: 15000,
      totalVentas: 25,
      totalComprado: 125000,
      productoMasComprado: "Producto ABC",
      cantidadProductoMasComprado: 45,
      diasAtraso: 5,
      ranking: 3,
      totalClientes: 150,
    };
  }, [periodo]);

  const movimientos = useMemo(() => {
    return [
      {
        id: "1",
        fecha: new Date("2025-10-05"),
        tipo: "venta",
        descripcion: "Venta #1234",
        monto: 5000,
        saldo: 15000,
      },
      {
        id: "2",
        fecha: new Date("2025-10-03"),
        tipo: "pago",
        descripcion: "Pago efectivo",
        monto: -3000,
        saldo: 10000,
      },
      {
        id: "3",
        fecha: new Date("2025-10-01"),
        tipo: "venta",
        descripcion: "Venta #1220",
        monto: 8000,
        saldo: 13000,
      },
    ];
  }, [periodo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <Label>Período de Análisis</Label>
            <Select value={periodo} onValueChange={(val) => setPeriodo(val as PeriodoType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_actual">Mes Actual</SelectItem>
                <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
                <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                <SelectItem value="ultimos_6_meses">Últimos 6 Meses</SelectItem>
                <SelectItem value="anio_actual">Año Actual</SelectItem>
                <SelectItem value="historico">Histórico Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Período: {format(rango.desde, "dd/MM/yyyy", { locale: es })} - {format(rango.hasta, "dd/MM/yyyy", { locale: es })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Cuenta Corriente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estadisticas.saldoCuentaCorriente > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${estadisticas.saldoCuentaCorriente.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticas.saldoCuentaCorriente > 0 ? 'Deuda pendiente' : 'Sin deuda'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.totalVentas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: ${estadisticas.totalComprado.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Cliente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{estadisticas.ranking}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {estadisticas.totalClientes} clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Días de Atraso</CardTitle>
            <AlertCircle className={`h-4 w-4 ${estadisticas.diasAtraso > 0 ? 'text-red-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estadisticas.diasAtraso > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {estadisticas.diasAtraso}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticas.diasAtraso > 0 ? 'Pagos con atraso' : 'Al día'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movimientos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="productos">Productos Comprados</TabsTrigger>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{format(mov.fecha, "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === "venta" ? "default" : "secondary"}>
                          {mov.tipo === "venta" ? "Venta" : "Pago"}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.descripcion}</TableCell>
                      <TableCell className={`text-right ${mov.monto > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {mov.monto > 0 ? '+' : ''}{mov.monto.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${mov.saldo.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Comprados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">{estadisticas.productoMasComprado}</p>
                    <p className="text-sm text-muted-foreground">Producto más vendido</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{estadisticas.cantidadProductoMasComprado}</p>
                    <p className="text-sm text-muted-foreground">unidades</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Listado detallado de productos en desarrollo...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                  <p className="text-lg font-semibold">${estadisticas.saldoCuentaCorriente.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Comprado</p>
                  <p className="text-lg font-semibold">${estadisticas.totalComprado.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad de Ventas</p>
                  <p className="text-lg font-semibold">{estadisticas.totalVentas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Promedio por Venta</p>
                  <p className="text-lg font-semibold">
                    ${(estadisticas.totalComprado / estadisticas.totalVentas).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Análisis de Comportamiento</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Badge variant={estadisticas.ranking <= 10 ? "default" : "secondary"}>
                      {estadisticas.ranking <= 10 ? "TOP 10" : "Regular"}
                    </Badge>
                    <span>
                      Cliente posicionado en el puesto #{estadisticas.ranking} del ranking de compradores
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant={estadisticas.diasAtraso === 0 ? "default" : "destructive"}>
                      {estadisticas.diasAtraso === 0 ? "Al día" : "Atrasado"}
                    </Badge>
                    <span>
                      {estadisticas.diasAtraso === 0
                        ? "No presenta atrasos en pagos"
                        : `Presenta ${estadisticas.diasAtraso} días de atraso en pagos`}
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
