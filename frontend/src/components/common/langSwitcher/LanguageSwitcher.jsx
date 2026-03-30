import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setLang, loginSuccess } from "../../../store/slices/authSlice";
import i18n from "../../../i18n";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./languageSwitcher.module.css"; 

const LANGUAGES = [
  { code: "uz", label: "Oʻzbek (Lotin)" },
  { code: "kr", label: "Ўзбек (Кирилл)" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const LanguageSwitcher = () => {
  const dispatch = useDispatch();
  const currentLang = useSelector((state) => state.auth.lang);
  const handleChange = async (newLang) => {
    i18n.changeLanguage(newLang);
    dispatch(setLang(newLang));
    try {
      const { data } = await axiosInstance.get("/auth/user/me");
      if (data?.payload) {
        const userData = {
          id: data.payload.id,
          firstName: data.payload.firstName,
          lastName: data.payload.lastName,
          profileImage: data.payload.profileImage,
          roles: data.payload.roles,
        };

        dispatch(
          loginSuccess({
            userData,
            access_token: localStorage.getItem("access_token"),
            refresh_token: localStorage.getItem("refresh_token"),
            token_type: localStorage.getItem("token_type"),
            device_id: localStorage.getItem("device_id"),
          })
        );
      }
    } catch (err) {
      console.warn("User data refresh failed on language change", err);
    }
  };

  return (
    <select
      className={styles.langSelect} 
      value={currentLang}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Language selector"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
