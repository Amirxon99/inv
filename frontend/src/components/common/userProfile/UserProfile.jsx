// src/components/common/userProfile/UserProfile.jsx
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, UserCircle } from "lucide-react"; // Qo'shimcha ikonka
import styles from "./userProfile.module.css";
import { logoutLocal } from "../../../store/slices/authSlice";

function UserProfile() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    dispatch(logoutLocal());
    setOpen(false);
    navigate("/login");
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className={styles.icon}>
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt="User"
              className={styles.avatar}
            />
          ) : (
            <User size={24} />
          )}
        </div>
        {/* Ism-familiya: Kompyuterda ko'rinadi, mobilda yashiriladi */}
        <span className={styles.name}>
          {user.first_name} {user.last_name}
        </span>
      </button>

      {open && (
        <div className={styles.panel} role="menu">
          {/* MOBIL UCHUN PANEL ICHIDA ISM-FAMILIYA */}
          <div className={styles.userInfoMobile}>
            <p className={styles.mobileFullName}>
              {user.first_name} {user.last_name}
            </p>
            <div className={styles.divider}></div>
          </div>

          <ul className={styles.list}>
            <li className={styles.item} role="menuitem">
              <UserCircle size={18} />
              <span>Profile</span>
            </li>
            <li className={styles.item} role="menuitem">
              <Settings size={18} />
              <span>Settings</span>
            </li>
            <div className={styles.divider}></div>
            <li
              className={`${styles.item} ${styles.logout}`}
              role="menuitem"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default UserProfile;