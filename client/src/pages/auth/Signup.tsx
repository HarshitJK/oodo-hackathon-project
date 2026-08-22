import React from "react";
import { Navigate } from "react-router-dom";

const Signup: React.FC = () => {
  return <Navigate to="/auth/login" replace />;
};

export default Signup;
