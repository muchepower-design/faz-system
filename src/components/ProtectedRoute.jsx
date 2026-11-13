// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  admin:              '/admin/dashboard',
  super_admin:        '/admin/dashboard',
  faz_admin:          '/faz-admin/dashboard',
  finance_officer:    '/finance/dashboard',
  vendor:             '/dashboard',           // handled by VendorRedirect eventually
  match_commissioner: '/commissioner/dashboard',
  media_officer:      '/media/dashboard',
  club_rep:           '/club/dashboard',
  referee:            '/referee/dashboard',
  customer:           '/fan/dashboard',
  viewer:             '/fan/dashboard',
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-faz-green border-t-faz-orange rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role || (user.roles && user.roles[0]) || 'viewer';
  const home = ROLE_HOME[role] || '/fan/dashboard';

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to={home} replace />;
  }
  return children;
};

export default ProtectedRoute;



/*import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/admin" />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

export default ProtectedRoute;

*/