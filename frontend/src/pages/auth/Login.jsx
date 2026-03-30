// src/pages/Login/Login.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, bootstrapAuth } from "../../store/slices/authSlice";
import axiosInstance from "../../api/axiosInstanse";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/images/logo.png";
import styles from "./login.module.css";
import DisplaySettings from "../../components/common/displaySwitcher/DisplaySettings";
import { FiEye, FiEyeOff } from "react-icons/fi";
import LanguageSwitcher from "../../components/common/langSwitcher/LanguageSwitcher";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const { loading } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      const { data } = await axiosInstance.post("/auth/login", {
        username: form.username,
        password: form.password,
      });

      if (!data?.accessToken) throw new Error("Token error");
      dispatch(loginSuccess(data));

      await dispatch(bootstrapAuth()).unwrap();

      navigate("/");
    } catch (err) {
      console.error(err);
      setLocalError(t("login_error") || "Login yoki parol xato");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.wrapper_container}>
        <div className={styles.leftSection}>
          <div className={styles.logo_box}>
            <img src={logo} alt="logo" className={styles.logo} />
            <div className={styles.orgName}>
              <div className={styles.mainLogoText}>{t("logo") || "E-INVENTARIZATSIYA"}</div>
            </div>
          </div>
          <h2 className={styles.title}>
            {t("title") || "Moddiy aktivlarni hisobga olish yagona axborot tizimi"}
          </h2>
          <p className={styles.subtitle}>
            {t("subtitle") || "Tizim orqali barcha turdagi qurilmalar va inventarlarni raqamli nazorat qiling."}
          </p>
        </div>

        <div className={styles.rightSection}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t("login") || "Tizimga kirish"}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>{t("username") || "Login"}</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder={t("username_placeholder") || "Loginni kiriting"}
                required
              />

              <label>{t("password") || "Parol"}</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={t("password_placeholder") || "Parolni kiriting"}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {localError && <p className={styles.error}>{localError}</p>}

              <button type="submit" className={styles.loginBtn} disabled={loading}>
                {loading ? t("loading") || "Yuklanmoqda..." : t("login") || "Kirish"}
              </button>
            </form>
          </div>

          <div className={styles.userControllers}>
            <DisplaySettings color="white" />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;