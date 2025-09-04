import { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProveedores, useDeleteProveedor, type Proveedor } from '@/hooks/useProveedores';
import { ProveedorForm } from './ProveedorForm';

export function ProveedoresList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: proveedores, isLoading, error } = useProveedores();
  const deleteProveedor = useDeleteProveedor();

  const filteredProveedores = proveedores?.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.cuit.includes(searchTerm)
  ) || [];

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteProveedor.mutate(id);
  };

  const handleNewProveedor = () => {
    setSelectedProveedor(undefined);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProveedor(undefined);
  };

  const getSituacionAfipBadge = (situacion: string) => {
    const variants = {
      'responsable_inscripto': 'default',
      'monotributo': 'secondary',
      'exento': 'outline',
    } as const;

    const labels = {
      'responsable_inscripto': 'R.I.',
      'monotributo': 'Monotributo',
      'exento': 'Exento',
    } as const;

    return (
      <Badge variant={variants[situacion as keyof typeof variants] || 'outline'}>
        {labels[situacion as keyof typeof labels] || situacion}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-pulse text-muted-foreground">Cargando proveedores...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-destructive">Error al cargar los proveedores</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <CardTitle className="text-xl font-semibold">Proveedores</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, razón social o CUIT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleNewProveedor} className="whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proveedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProveedores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron proveedores que coincidan con la búsqueda.' : 'No hay proveedores registrados.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre/Razón Social</TableHead>
                    <TableHead>CUIT</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Situación AFIP</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProveedores.map((proveedor) => (
                    <TableRow key={proveedor.id}>
                      <TableCell className="font-medium">
                        {proveedor.tipo_persona === 'juridica' 
                          ? proveedor.razon_social
                          : `${proveedor.nombre} ${proveedor.apellido || ''}`.trim()
                        }
                      </TableCell>
                      <TableCell>{proveedor.cuit}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{proveedor.calle} {proveedor.numero}</div>
                          <div className="text-muted-foreground">
                            {proveedor.localidad}, {proveedor.provincia}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {proveedor.telefono && <div>{proveedor.telefono}</div>}
                          {proveedor.email && <div className="text-muted-foreground">{proveedor.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSituacionAfipBadge(proveedor.situacion_afip)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {proveedor.tipo_persona === 'fisica' ? 'Física' : 'Jurídica'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEdit(proveedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente el proveedor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(proveedor.id!)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProveedorForm
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        proveedor={selectedProveedor}
      />
    </>
  );
}