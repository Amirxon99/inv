import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className={styles.notfoundPage}>
      <div className={styles.overlay}></div>

      <div className={styles.content}>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Page Not Found</h2>
       

        <button className={styles.btn} onClick={() => navigate("/")}>
         Back
        </button>
      </div>
    </div>
  );
}

export default NotFound;
