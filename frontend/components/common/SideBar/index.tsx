import {
  Bubbles,
  BubblesIcon,
  Calendar,
  Droplets,
  Home,
  House,
  Inbox,
  LayoutDashboard,
  Leaf,
  Search,
  Settings,
  Sprout,
  Sun,
  ThermometerSun,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SENSOR_ICONS } from "@/types";

// Menu items.
const items = [
  {
    title: "Temperatura",
    url: "/temperature",
    icon: SENSOR_ICONS["temperature"],
  },
  {
    title: "Wilgotność",
    url: "/humidity",
    icon: SENSOR_ICONS["humidity"],
  },
  {
    title: "Nasłonecznienie",
    url: "/sunlight",
    icon: SENSOR_ICONS["sunlight"],
  },
  {
    title: "CO2",
    url: "/co2",
    icon: SENSOR_ICONS["co2"],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="my-10 ">
            <div className="flex text-sm text-green-800 items-end gap ">
              GreenHouse Simulator
              <Sprout className="ml-1 mb-0.5" />
              <House className="mb-0.5" />
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={"/"}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Rodzaje sensorów</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
