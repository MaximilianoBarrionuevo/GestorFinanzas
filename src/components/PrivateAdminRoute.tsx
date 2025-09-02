// components/PrivateAdminRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

type Props = {
  children: React.ReactNode;
};

export const PrivateAdminRoute = ({ children }: Props) => {
  const [authorized, setAuthorized] = useState<null | boolean>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user && user.email === "maxisbarrionuevo@gmail.com") {
        setAuthorized(true);
      } else {
        setAuthorized(false);
      }
    };

    checkUser();
  }, []);

  if (authorized === null) return <div className="text-center mt-10">Cargando...</div>;

  return authorized ? <>{children}</> : <Navigate to="/login" replace />;
};
