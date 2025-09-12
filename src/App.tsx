import { Routes, Route } from "react-router-dom"
import Login from './pages/Login'
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import Main from "./pages/Main"

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Main/>}/>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default App
