import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/Home.jsx";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import axios from 'axios';
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard.jsx'; // Corrected path
import { UserContext, UserContextProvider } from './context/userContext.jsx';
import Hotel from "./pages/Hotels.jsx";
import List from "./pages/List.jsx";
import AdminRegister from "./pages/AdminRegister.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import AdminList from "./pages/AdminList.jsx";
import { userColumns, hotelColumns, roomColumns } from "./datatablesource.jsx";
import AdminNewRoom from "./pages/AdminNewRoom.jsx";
import AdminNewHotel from "./pages/AdminNewHotel.jsx";
import { userInputs} from "./formSource.jsx";
import Reserved from "./pages/Reserved.jsx";
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AdminViewHotel from "./pages/AdminViewHotel.jsx";
import AdminListRooms from "./pages/AdminListRooms.jsx";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://hotel12.app.aletcloud.com/api';
axios.defaults.withCredentials = true

function App() {
  const { user, ready } = useContext(UserContext);

  const ProtectedRoute = ({ children }) => {
    if (!ready) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/admin/login" />;
    }

    return children;
  };

  return (
    <>
    <Toaster position ='bottom-right' toastOptions={{duration: 2000}} />
    <BrowserRouter basename="/front">
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hotels" element={<List/>}/>
        <Route path="/hotels/:id" element={<Hotel/>}/>
        <Route path="/reserved" element={<Reserved/>}/>
          <Route path="/admin/">
          <Route path="register" element={<AdminRegister />} />
            <Route
              index
              element={
                <ProtectedRoute><AdminHome /></ProtectedRoute>
              }
            />
          <Route path="login" element={<AdminLogin />} />
            <Route path="hotels">
              <Route
                index
                element={
                    <ProtectedRoute>
                      <AdminList columns={hotelColumns} />
                    </ProtectedRoute>
                }
              />
              <Route path=":id">
              <Route
              index
                element={
                    <ProtectedRoute>
                      <AdminViewHotel />
                    </ProtectedRoute>
                }
              />
              <Route path="rooms">
               <Route index element={ 
                  <ProtectedRoute>
                    <AdminListRooms columns={roomColumns} />
                  </ProtectedRoute>
                }
              />
             <Route
                path="new"
                element={
                    <ProtectedRoute>
                      <AdminNewRoom />
                    </ProtectedRoute>
                }
              />
              </Route>
               </Route>
              <Route
                path="new"
                element={
                    <ProtectedRoute>
                      <AdminNewHotel  />
                    </ProtectedRoute>
                }
              />
           
            </Route>
          </Route>
      </Routes>
    </BrowserRouter>
    </>
    
  );
}

export default App;
