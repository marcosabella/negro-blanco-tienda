import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Proveedores from "./pages/Proveedores";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import CuentaCorriente from "./pages/CuentaCorriente";
import Bancos from "./pages/Bancos";
import Tarjetas from "./pages/Tarjetas";
import Comercio from "./pages/Comercio";
import Afip from "./pages/Afip";
import Cheques from "./pages/Cheques";
import NotFound from "./pages/NotFound";
import ListadoClientes from "./pages/listados/ListadoClientes";
import ListadoProveedores from "./pages/listados/ListadoProveedores";
import ListadoProductos from "./pages/listados/ListadoProductos";
import ListadoVentas from "./pages/listados/ListadoVentas";
import ListadoCuentaCorriente from "./pages/listados/ListadoCuentaCorriente";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <header className="h-14 border-b border-border bg-background flex items-center px-4">
                <SidebarTrigger className="mr-4" />
                <h1 className="font-semibold text-foreground">Sistema de Ventas Minorista</h1>
              </header>
              <main className="flex-1 bg-background">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/cuenta-corriente" element={<CuentaCorriente />} />
          <Route path="/comercio" element={<Comercio />} />
          <Route path="/bancos" element={<Bancos />} />
          <Route path="/tarjetas" element={<Tarjetas />} />
          <Route path="/afip" element={<Afip />} />
          <Route path="/cheques" element={<Cheques />} />
          <Route path="/listados/clientes" element={<ListadoClientes />} />
          <Route path="/listados/proveedores" element={<ListadoProveedores />} />
          <Route path="/listados/productos" element={<ListadoProductos />} />
          <Route path="/listados/ventas" element={<ListadoVentas />} />
          <Route path="/listados/cuenta-corriente" element={<ListadoCuentaCorriente />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
