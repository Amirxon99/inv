import styles from "./modeSwitcher.module.css";
import { useDispatch, useSelector } from "react-redux";
import { setSiteMode } from "../../../store/slices/uiSlice";

const MODES = [
  { key: "normal", label: "A" },
  { key: "grayscale", label: "A" },
  { key: "dimmed", label: "A" },
];

function ModeSwitcher() {
  const dispatch = useDispatch();
  const active = useSelector((s) => s.ui.siteMode);

  const changeMode = (mode) => {
    dispatch(setSiteMode(mode));
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Rang rejimi</p>

      <div className={styles.buttons}>
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => changeMode(m.key)}
            className={`${styles.btn} ${styles[m.key]} ${
              active === m.key ? styles.active : ""
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ModeSwitcher;
