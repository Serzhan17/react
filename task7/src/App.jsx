// App.jsx only describes the routes. Pages are lazy-loaded (code splitting).
import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout.jsx";
import Home from "./pages/Home.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const About = lazy(() => import("./pages/About.jsx"));
const TaskList = lazy(() => import("./pages/TaskList.jsx"));
const TaskDetails = lazy(() => import("./pages/TaskDetails.jsx"));
const TaskFormPage = lazy(() => import("./pages/TaskFormPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Offline = lazy(() => import("./pages/Offline.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="tasks">
          <Route index element={<TaskList />} />
          <Route path="new" element={<TaskFormPage />} />
          <Route path=":id" element={<TaskDetails />} />
          <Route path=":id/edit" element={<TaskFormPage />} />
        </Route>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="offline" element={<Offline />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
