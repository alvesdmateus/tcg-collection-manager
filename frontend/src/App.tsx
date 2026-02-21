import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Collections from './pages/Collections'
import CollectionDetails from './pages/CollectionDetails'
import ProtectedRoute from './components/ProtectedRoute'
import SidebarLayout from './components/Sidebar/SidebarLayout'
import NotFound from './pages/NotFound'
import ConnectionBanner from './components/Notifications/ConnectionBanner'
import ToastContainer from './components/Notifications/ToastContainer'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <ConnectionBanner />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <SidebarLayout><Collections /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections/:collectionId"
              element={
                <ProtectedRoute>
                  <SidebarLayout><CollectionDetails /></SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
