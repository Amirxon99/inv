import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setOnAuthFail } from "../../api/axiosInstanse";

function AxiosAuthBridge({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    setOnAuthFail(() => navigate("/login", { replace: true }));
  }, [navigate]);

  return children; 
}

export default AxiosAuthBridge;
