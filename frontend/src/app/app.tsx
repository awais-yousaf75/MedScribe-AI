// src/app/App.tsx
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { router } from "./router";
import { Toaster } from "../components/ui/sonner";

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;