
import { Navigate, Route, Routes } from 'react-router';
import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotificationPage from "./pages/NotificationsPage.jsx";
import CallPage from "./pages/CallPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import OnboardingPage from "./pages/OnBoardingPage.jsx";

import { Toaster } from 'react-hot-toast'

import Pageloader from './components/Pageloader.jsx';
import useAuthUser from './hooks/useAuthUser.js';





const App = () => {
  //tanstack query

  const { isLoading, authUser } = useAuthUser();

  const isAuthenticated = Boolean(authUser);
  const isOnBoarded = authUser?.isOnBoarded;

  if (isLoading) return <Pageloader />

  return (
    <div className="h-screen text-5xl" data-theme="light">
      {/* this  */}
      <Routes>
        <Route path='/' element={isAuthenticated && isOnBoarded ? (
          <HomePage />) : (
          <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />
        )
        }
        />
        <Route path='/signup' element={!isAuthenticated ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path='/login' element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
        <Route path='/notification' element={isAuthenticated ? <NotificationPage /> : <Navigate to="/login" />} />
        <Route path='/call' element={isAuthenticated ? <CallPage /> : <Navigate to="/login" />} />
        <Route path='/chat' element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path='/onboarding' element={isAuthenticated ? <OnboardingPage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App
