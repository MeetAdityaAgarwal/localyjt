import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './lib/trpc';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { RiderDashboard } from './pages/rider/Dashboard';
import { Login } from './pages/auth/Login';
import { ResetPassword } from './pages/auth/ResetPassword';
import { useAuth } from './hooks/useAuth';
import { Loader } from './components/ui/loader';
import { createTrpcClient } from './utils/trpc';

function ProtectedRoute({ children, allowedRoles }: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return <Loader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/" element={<DashboardLayout />}>
          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="manager"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Rider Routes */}
          <Route
            path="rider"
            element={
              <ProtectedRoute allowedRoles={['RIDER']}>
                <RiderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect based on role */}
          <Route
            index
            element={
              user ? (
                <Navigate
                  to={
                    user.role === 'ADMIN'
                      ? 'admin'
                      : user.role === 'MANAGER'
                        ? 'manager'
                        : 'rider'
                  }
                  replace
                />
              ) : (
                <Navigate to="login" replace />
              )
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const { token, initialize } = useAuth();
  const [queryClient] = React.useState(() => new QueryClient());
  const trpcClient = useMemo(() => createTrpcClient(token), [token]);

  // Initialize auth state on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { trpc } from './lib/trpc';
// import { DashboardLayout } from './components/layout/DashboardLayout';
// import { AdminDashboard } from './pages/admin/Dashboard';
// import { ManagerDashboard } from './pages/manager/Dashboard';
// import { RiderDashboard } from './pages/rider/Dashboard';
// import { Login } from './pages/auth/Login';
// import { ResetPassword } from './pages/auth/ResetPassword';
// import { useAuth } from './hooks/useAuth';
// import { Loader } from './components/ui/loader';
// import { httpBatchLink } from '@trpc/client';
//
// function ProtectedRoute({ children, allowedRoles }: {
//   children: React.ReactNode;
//   allowedRoles: string[];
// }) {
//   const { user, isInitialized } = useAuth();
//
//   if (!isInitialized) {
//     return <Loader />;
//   }
//
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }
//
//   if (!allowedRoles.includes(user.role)) {
//     return <Navigate to="/" replace />;
//   }
//
//   return <>{children}</>;
// }
//
// function AppContent() {
//   const { user, isInitialized } = useAuth();
//
//   if (isInitialized) {
//     return <Loader />;
//   }
//
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Public Routes */}
//         <Route
//           path="/login"
//           element={user ? <Navigate to="/" replace /> : <Login />}
//         />
//         <Route path="/reset-password" element={<ResetPassword />} />
//
//         {/* Protected Routes */}
//         <Route path="/" element={<DashboardLayout />}>
//           {/* Admin Routes */}
//           <Route
//             path="admin"
//             element={
//               <ProtectedRoute allowedRoles={['ADMIN']}>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             }
//           />
//
//           {/* Manager Routes */}
//           <Route
//             path="manager"
//             element={
//               <ProtectedRoute allowedRoles={['MANAGER']}>
//                 <ManagerDashboard />
//               </ProtectedRoute>
//             }
//           />
//
//           {/* Rider Routes */}
//           <Route
//             path="rider"
//             element={
//               <ProtectedRoute allowedRoles={['RIDER']}>
//                 <RiderDashboard />
//               </ProtectedRoute>
//             }
//           />
//
//           {/* Default redirect based on role */}
//           <Route
//             path="/"
//             element={
//               user ? (
//                 <Navigate
//                   to={
//                     user.role === 'ADMIN'
//                       ? '/admin'
//                       : user.role === 'MANAGER'
//                         ? '/manager'
//                         : '/rider'
//                   }
//                   replace
//                 />
//               ) : (
//                 <Navigate to="/login" replace />
//               )
//             }
//           />
//         </Route>
//       </Routes>
//     </BrowserRouter>
//   );
// }
//
// function App() {
//   // const { token } = useAuth();
//   const [queryClient] = React.useState(() => new QueryClient());
//   // const [trpcClient] = React.useState(() => createTrpcClient(token));
//
//   const [trpcClient] = React.useState(() =>
//     trpc.createClient({
//       links: [
//         httpBatchLink({
//           url: '/api/trpc',
//           // Include credentials in the request
//           fetch(url, options) {
//             return fetch(url, {
//               ...options,
//               credentials: 'include',
//             });
//           },
//         }),
//       ],
//     })
//   );
//
//   return (
//     <trpc.Provider client={trpcClient} queryClient={queryClient}>
//       <QueryClientProvider client={queryClient}>
//         <AppContent />
//       </QueryClientProvider>
//     </trpc.Provider>
//   );
// }
//
// export default App;
