import { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProveedores, useDeleteProveedor, type Proveedor } from '@/hooks/useProveedores';
import { ProveedorForm } from './ProveedorForm';

export function ProveedoresList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: proveedores = [], isLoading } = useProveedores();
  const deleteProveedor = useDeleteProveedor();

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.cuit.includes(searchTerm)
  );

  const handleEdit = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteProveedor.mutateAsync(id);
  };

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedProveedor(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Cargando proveedores...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proveedor</DialogTitle>
            </DialogHeader>
            <ProveedorForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredProveedores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer proveedor'
                }
              </p>
              {!searchTerm && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Proveedor
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProveedores.map((proveedor) => (
            <Card key={proveedor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold">
                        {proveedor.tipo_persona === 'juridica'
                          ? proveedor.razon_social
                          : `${proveedor.nombre} ${proveedor.apellido || ''}`.trim()
                        }
                      </h3>
                      <Badge variant="secondary">
                        {proveedor.tipo_persona === 'fisica' ? 'Persona Física' : 'Persona Jurídica'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">CUIT:</span>
                        <p>{proveedor.cuit}</p>
                      </div>

                      <div>
                        <span className="font-medium text-muted-foreground">Dirección:</span>
                        <p>{proveedor.calle} {proveedor.numero}, {proveedor.localidad}</p>
                      </div>

                      <div>
                        <span className="font-medium text-muted-foreground">Situación AFIP:</span>
                        <p>{proveedor.situacion_afip}</p>
                      </div>

                      {proveedor.telefono && (
                        <div>
                          <span className="font-medium text-muted-foreground">Teléfono:</span>
                          <p>{proveedor.telefono}</p>
                        </div>
                      )}

                      {proveedor.email && (
                        <div>
                          <span className="font-medium text-muted-foreground">Email:</span>
                          <p>{proveedor.email}</p>
                        </div>
                      )}

                      <div>
                        <span className="font-medium text-muted-foreground">Provincia:</span>
                        <p>{proveedor.provincia}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && selectedProveedor?.id === proveedor.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setSelectedProveedor(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(proveedor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Proveedor</DialogTitle>
                        </DialogHeader>
                        {selectedProveedor && (
                          <ProveedorForm
                            proveedor={selectedProveedor}
                            onSuccess={handleEditSuccess}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente
                            la información de {proveedor.tipo_persona === 'juridica'
                              ? proveedor.razon_social
                              : `${proveedor.nombre} ${proveedor.apellido || ''}`.trim()}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => proveedor.id && handleDelete(proveedor.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}