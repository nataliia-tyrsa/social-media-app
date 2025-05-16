import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login'
import Register from '../pages/Register'
import Feed from '../pages/Feed'
import Profile from '../pages/Profile'

export default function Router(){
    return (
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/" element={<Navigate to="/feed" />} />
        </Routes>
      </BrowserRouter>
    )
}