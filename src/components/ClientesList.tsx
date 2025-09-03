import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ClientesList() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="border rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Sistema de Clientes</h3>
        <p className="text-muted-foreground mb-4">
          Para activar la gestión completa de clientes, necesitas crear la tabla en Supabase.
        </p>
        <div className="text-sm text-muted-foreground">
          <strong>Próximos pasos:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Abrir el editor SQL en tu proyecto Supabase</li>
            <li>Ejecutar el script del archivo SUPABASE_SETUP.md</li>
            <li>La gestión completa estará disponible automáticamente</li>
          </ol>
        </div>
      </div>
    </div>
  );
}