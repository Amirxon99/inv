import styles from "./fontSize.module.css";
import { useDispatch, useSelector } from "react-redux";
import { setFontSize } from "../../../store/slices/uiSlice";

function FontSizeSwitcher() {
  const dispatch = useDispatch();
  const active = useSelector((s) => s.ui.fontSize);

  const changeFontSize = (size) => {
    dispatch(setFontSize(size));
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Shrift o‘lchami</p>

      <div className={styles.buttons}>
        <button
          type="button"
          className={`${styles.btn} ${active === "small" ? styles.active : ""}`}
          onClick={() => changeFontSize("small")}
        >
          A
        </button>

        <button
          type="button"
          className={`${styles.btn} ${active === "medium" ? styles.active : ""}`}
          onClick={() => changeFontSize("medium")}
        >
          A
        </button>

        <button
          type="button"
          className={`${styles.btn} ${active === "large" ? styles.active : ""}`}
          onClick={() => changeFontSize("large")}
        >
          A
        </button>
      </div>
    </div>
  );
}

export default FontSizeSwitcher;
