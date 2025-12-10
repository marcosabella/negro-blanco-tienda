import { Users, Truck, Package, ShoppingCart, CreditCard, Building2, FileText, ChevronDown, Settings, Store, FileKey, Receipt } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
const menuItems = [{
  title: "Clientes",
  url: "/clientes",
  icon: Users
}, {
  title: "Proveedores",
  url: "/proveedores",
  icon: Truck
}, {
  title: "Productos",
  url: "/productos",
  icon: Package
}, {
  title: "Ventas",
  url: "/ventas",
  icon: ShoppingCart
}, {
  title: "Cuenta Corriente",
  url: "/cuenta-corriente",
  icon: CreditCard
}, {
  title: "Cartera de Cheques",
  url: "/cheques",
  icon: Receipt
}];
const configuracionItems = [{
  title: "Mi Comercio",
  url: "/comercio",
  icon: Store
}, {
  title: "Bancos",
  url: "/bancos",
  icon: Building2
}, {
  title: "Tarjetas",
  url: "/tarjetas",
  icon: CreditCard
}, {
  title: "AFIP",
  url: "/afip",
  icon: FileKey
}];
const listadosItems = [{
  title: "Clientes",
  url: "/listados/clientes",
  icon: Users
}, {
  title: "Proveedores",
  url: "/listados/proveedores",
  icon: Truck
}, {
  title: "Productos",
  url: "/listados/productos",
  icon: Package
}, {
  title: "Ventas",
  url: "/listados/ventas",
  icon: ShoppingCart
}, {
  title: "Cuenta Corriente",
  url: "/listados/cuenta-corriente",
  icon: CreditCard
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [configuracionOpen, setConfiguracionOpen] = useState(false);
  const [listadosOpen, setListadosOpen] = useState(false);
  const isActive = (path: string) => currentPath === path;
  const isConfiguracionActive = currentPath === '/comercio' || currentPath === '/bancos' || currentPath === '/tarjetas' || currentPath === '/afip';
  const isListadosActive = currentPath.startsWith('/listados');
  return <Sidebar collapsible="icon">
      <SidebarContent className="bg-primary-foreground text-primary shadow-md">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className={`font-bold text-sidebar-foreground ${collapsed ? 'hidden' : 'text-lg'}`}>
            {!collapsed && "Comercio AR"}
          </h2>
        </div>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-sidebar-foreground/70 px-4">
            {!collapsed && "Gestión"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="opacity-100">
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className={`mx-2 ${isActive(item.url) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                    <NavLink to={item.url} end className="font-thin text-lg">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}

              <Collapsible open={configuracionOpen} onOpenChange={setConfiguracionOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`mx-2 ${isConfiguracionActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                      <Settings className="h-4 w-4" />
                      {!collapsed && <span className="ml-3 text-lg">Configuración</span>}
                      {!collapsed && <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${configuracionOpen ? 'rotate-180' : ''}`} />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && <CollapsibleContent>
                      <SidebarMenuSub>
                        {configuracionItems.map(item => <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild className={isActive(item.url) ? 'bg-sidebar-accent/50' : ''}>
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span className="ml-2 text-lg">{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>)}
                      </SidebarMenuSub>
                    </CollapsibleContent>}
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible open={listadosOpen} onOpenChange={setListadosOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`mx-2 ${isListadosActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                      <FileText className="h-4 w-[16px]" />
                      {!collapsed && <span className="ml-3 font-normal text-lg">Listados</span>}
                      {!collapsed && <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${listadosOpen ? 'rotate-180' : ''}`} />}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {!collapsed && <CollapsibleContent>
                      <SidebarMenuSub>
                        {listadosItems.map(item => <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild className={isActive(item.url) ? 'bg-sidebar-accent/50' : ''}>
                              <NavLink to={item.url}>
                                <item.icon className="h-4 w-4" />
                                <span className="ml-2 text-lg">{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>)}
                      </SidebarMenuSub>
                    </CollapsibleContent>}
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}