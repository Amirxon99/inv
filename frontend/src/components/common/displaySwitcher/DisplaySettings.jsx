import { useState, useRef, useEffect } from "react";
import ModeSwitcher from "../modeSwitcher/ModeSwitcher";
import FontSizeSwitcher from "../fontSizeSwitcher/FontSizeSwitcher";
import styles from "./displaySettings.module.css";
import { Glasses } from "lucide-react";

function DisplaySettings({ color }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label="Display switcher"
        type="button"
      >
        <Glasses size={35} style={{ color }} />
      </button>

      {open && (
        <div className={styles.panel}>
          <ModeSwitcher />
          <FontSizeSwitcher />
        </div>
      )}
    </div>
  );
}

export default DisplaySettings;
