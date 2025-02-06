import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

const navigation = {
  ADMIN: [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Invoices', href: '/admin/invoices', icon: FileText },
    { name: 'Collections', href: '/admin/collections', icon: CreditCard },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  MANAGER: [
    { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
    { name: 'Riders', href: '/manager/riders', icon: Users },
    { name: 'Collections', href: '/manager/collections', icon: CreditCard },
    { name: 'Transfers', href: '/manager/transfers', icon: FileText },
  ],
  RIDER: [
    { name: 'Dashboard', href: '/rider', icon: LayoutDashboard },
    { name: 'Collections', href: '/rider/collections', icon: CreditCard },
    { name: 'Customers', href: '/rider/customers', icon: Users },
  ],
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const role = user?.role || 'RIDER';

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
              <div className="flex flex-col flex-grow">
                <nav className="flex-1 px-2 pb-4 space-y-1">
                  {navigation[role].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          location.pathname === item.href
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                        )}
                      >
                        <Icon
                          className={cn(
                            location.pathname === item.href
                              ? 'text-gray-500'
                              : 'text-gray-400 group-hover:text-gray-500',
                            'mr-3 flex-shrink-0 h-6 w-6'
                          )}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={logout}
                >
                  <LogOut className="mr-3 h-6 w-6" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
