import styles from "./navbar.module.css";
import logo from "../../../assets/images/logo.png";
import { useTranslation } from "react-i18next";
import DisplaySettings from "../../common/displaySwitcher/DisplaySettings";
import UserProfile from "../../common/userProfile/UserProfile";
import { useSelector } from "react-redux";
import LanguageSwitcher from "../../common/langSwitcher/LanguageSwitcher";
import { Menu } from "lucide-react"; // Hamburger menyu uchun

const Navbar = ({ toggleMobileMenu }) => {
  const { t } = useTranslation("auth");
  const user = useSelector((state) => state.auth.user);

  return (
    <nav className={styles.navbar}>
      {/* MOBILDA LOGOTIP O'RNIGA CHIQADIGAN TUGMA */}
      <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu}>
        <Menu size={24} />
      </button>

      {/* LOGO QISMI (MOBILDA YASHIRILADI) */}
      <div className={styles.logo}>
        <img src={logo} alt="logo" />
        <span className={styles.title}>{t("nav_title")}</span>
      </div>

      <div className={styles.right}>
        <DisplaySettings />
        <LanguageSwitcher />

        <div className={styles.profile}>
          <UserProfile />

          {user && (
            <span className={styles.username}>
              {typeof user === "string" ? user : user.firstName || user.firtName}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;