import { useState, useMemo, useRef } from 'react';
import { useCuentaCorriente } from '@/hooks/useCuentaCorriente';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Printer, Search } from 'lucide-react';
import { format } from 'date-fns';

const ListadoCuentaCorriente = () => {
  const { getResumenCuentaCorreinte, useMovimientosByCliente } = useCuentaCorriente();
  const { data: resumen = [], isLoading } = getResumenCuentaCorreinte();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: movimientosCliente = [] } = useMovimientosByCliente(selectedClienteId);

  // Filter clients with balance
  const clientesConSaldo = useMemo(() => {
    return resumen.filter(cliente => cliente.saldo_actual !== 0);
  }, [resumen]);

  // Apply filters
  const filteredClientes = useMemo(() => {
    return clientesConSaldo.filter(cliente => {
      const matchesSearch = 
        cliente.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cliente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.cliente_cuit.includes(searchTerm);

      const matchesFecha = (() => {
        if (!cliente.ultimo_movimiento) return true;
        const fechaMov = new Date(cliente.ultimo_movimiento);
        if (fechaDesde && fechaMov < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaMov > new Date(fechaHasta)) return false;
        return true;
      })();

      return matchesSearch && matchesFecha;
    });
  }, [clientesConSaldo, searchTerm, fechaDesde, fechaHasta]);

  const stats = useMemo(() => {
    const totalDeudores = filteredClientes.filter(c => c.saldo_actual > 0).length;
    const totalAcreedores = filteredClientes.filter(c => c.saldo_actual < 0).length;
    const totalSaldoDeudor = filteredClientes
      .filter(c => c.saldo_actual > 0)
      .reduce((sum, c) => sum + c.saldo_actual, 0);
    const totalSaldoAcreedor = filteredClientes
      .filter(c => c.saldo_actual < 0)
      .reduce((sum, c) => sum + Math.abs(c.saldo_actual), 0);

    return {
      totalDeudores,
      totalAcreedores,
      totalSaldoDeudor,
      totalSaldoAcreedor,
    };
  }, [filteredClientes]);

  const handlePrintReport = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const clienteSeleccionado = selectedClienteId 
    ? filteredClientes.find(c => c.cliente_id === selectedClienteId)
    : null;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 print:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Listado de Cuenta Corriente</h1>
            <p className="text-muted-foreground">
              Reporte de clientes con saldo pendiente
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredClientes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Deudores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.totalDeudores}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.totalSaldoDeudor)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Acreedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalAcreedores}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(stats.totalSaldoAcreedor)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Neto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats.totalSaldoDeudor - stats.totalSaldoAcreedor)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre los clientes por nombre, CUIT o fecha</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nombre, apellido o CUIT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaDesde">Fecha Desde</Label>
                  <Input
                    id="fechaDesde"
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaHasta">Fecha Hasta</Label>
                  <Input
                    id="fechaHasta"
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button onClick={clearFilters} variant="outline" className="w-full">
                    Limpiar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes con Saldo</CardTitle>
              <CardDescription>
                Mostrando {filteredClientes.length} de {clientesConSaldo.length} clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CUIT</TableHead>
                      <TableHead className="text-right">Débitos</TableHead>
                      <TableHead className="text-right">Créditos</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead>Últ. Movimiento</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No hay clientes con saldo
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClientes.map((cliente) => (
                        <TableRow key={cliente.cliente_id}>
                          <TableCell className="font-medium">
                            {cliente.cliente_nombre} {cliente.cliente_apellido}
                          </TableCell>
                          <TableCell>{cliente.cliente_cuit}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cliente.total_debitos)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(cliente.total_creditos)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={cliente.saldo_actual > 0 ? 'destructive' : 'default'}
                              className={cliente.saldo_actual < 0 ? 'bg-green-600' : ''}
                            >
                              {formatCurrency(Math.abs(cliente.saldo_actual))}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cliente.ultimo_movimiento
                              ? format(new Date(cliente.ultimo_movimiento), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintReport(cliente.cliente_id)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Reporte
                            </Button>
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
      </div>

      {/* Print-only Report */}
      {clienteSeleccionado && (
        <div ref={printRef} className="hidden print:block p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Estado de Cuenta Corriente</h1>
            <div className="border-b pb-4 mb-4">
              <p className="text-lg font-semibold">
                {clienteSeleccionado.cliente_nombre} {clienteSeleccionado.cliente_apellido}
              </p>
              <p className="text-sm text-gray-600">CUIT: {clienteSeleccionado.cliente_cuit}</p>
              <p className="text-sm text-gray-600">
                Fecha: {format(new Date(), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2">Fecha</th>
                  <th className="text-left py-2">Concepto</th>
                  <th className="text-right py-2">Débito</th>
                  <th className="text-right py-2">Crédito</th>
                  <th className="text-right py-2">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {movimientosCliente.map((mov, index) => {
                  const saldoAcumulado = movimientosCliente
                    .slice(0, index + 1)
                    .reduce((acc, m) => {
                      return m.tipo_movimiento === 'debito'
                        ? acc + Number(m.monto)
                        : acc - Number(m.monto);
                    }, 0);

                  return (
                    <tr key={mov.id} className="border-b">
                      <td className="py-2">{format(new Date(mov.fecha_movimiento), 'dd/MM/yyyy')}</td>
                      <td className="py-2">{mov.concepto}</td>
                      <td className="text-right py-2">
                        {mov.tipo_movimiento === 'debito' ? formatCurrency(Number(mov.monto)) : '-'}
                      </td>
                      <td className="text-right py-2">
                        {mov.tipo_movimiento === 'credito' ? formatCurrency(Number(mov.monto)) : '-'}
                      </td>
                      <td className="text-right py-2 font-semibold">
                        {formatCurrency(saldoAcumulado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-black font-bold">
                  <td colSpan={2} className="py-2">TOTALES</td>
                  <td className="text-right py-2">
                    {formatCurrency(clienteSeleccionado.total_debitos)}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(clienteSeleccionado.total_creditos)}
                  </td>
                  <td className="text-right py-2">
                    {formatCurrency(clienteSeleccionado.saldo_actual)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {clienteSeleccionado.saldo_actual !== 0 && (
            <div className="mt-8 p-4 border-2 border-black">
              <p className="text-lg font-bold">
                Saldo {clienteSeleccionado.saldo_actual > 0 ? 'Deudor' : 'Acreedor'}:{' '}
                {formatCurrency(Math.abs(clienteSeleccionado.saldo_actual))}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ListadoCuentaCorriente;
