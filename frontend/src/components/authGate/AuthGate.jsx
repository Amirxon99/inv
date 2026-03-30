import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { bootstrapAuth } from "../../store/slices/authSlice";
import { FaSpinner } from "react-icons/fa";
import styles from "./authGate.module.css";

export default function AuthGate({ children }) {
  const dispatch = useDispatch();
  const loading = useSelector((s) => s.auth.loading);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <FaSpinner className={styles.spinner} />
      </div>
    );
  }

  return children;
}
