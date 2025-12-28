import { Calendar, Image, Users, UserCheck, Mic, LogOut, LayoutDashboard, Mail, User, ExternalLink, UserCheck2 } from 'lucide-react';
import { NavLink } from 'react-router-dom'; 
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard },
  { title: 'Events', url: '/admin/events', icon: Calendar },
  { title: 'External Events', url: '/admin/external-events', icon: ExternalLink },
  { title: 'Speakers', url: '/admin/speakers', icon: Mic },
  { title: 'Registrations', url: '/admin/registrations', icon: Users },
  { title: 'Users', url: '/admin/users', icon: UserCheck2 },
  { title: 'Volunteers', url: '/admin/volunteers', icon: UserCheck },
  { title: 'Messages', url: '/admin/messages', icon: Mail },
];

export function AdminSidebar() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent className="bg-card text-card-foreground">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground font-semibold text-xs uppercase tracking-widest mb-4 mt-2">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-transparent transition-none">
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium w-full transition-all duration-200 text-white ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 bg-card space-y-4">
        
        {/* Profile Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium w-full border transition-colors ${
                    isActive 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                  }`
                }
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex flex-col gap-1">
           <span className="text-xs font-medium text-muted-foreground uppercase">Logged in as</span>
           <span className="text-sm font-semibold text-foreground truncate" title={user?.email}>
             {user?.email}
           </span>
        </div>
        
        <Button
          variant="outline"
          className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 dark:border-destructive/50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}