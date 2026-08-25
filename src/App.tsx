import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Album } from '@/pages/Album'
import { Song } from '@/pages/Song'
import { Login } from '@/pages/Login'
import { Upload } from '@/pages/Upload'
import { Admin } from '@/pages/Admin'

function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/album/:id" element={<Album />} />
              <Route path="/song/:id" element={<Song />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <Upload />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AudioPlayerProvider>
    </AuthProvider>
  )
}

export default App
