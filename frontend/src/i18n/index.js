import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Auth fayllar
import uzAuth from "./locales/uz/auth.json";
import ruAuth from "./locales/ru/auth.json";
import krAuth from "./locales/kr/auth.json";
import enAuth from "./locales/en/auth.json";

// Dashboard/Home fayllar
import uzDhome from "./locales/uz/d_home.json";
import ruDhome from "./locales/ru/d_home.json";
import krDhome from "./locales/kr/d_home.json";
import enDhome from "./locales/en/d_home.json";

const resources = {
  uz: {
    auth: uzAuth,
    d_home: uzDhome,
  },
  ru: {
    auth: ruAuth,
    d_home: ruDhome,
  },
  kr: {
    auth: krAuth,
    d_home: krDhome,
  },
  en:{
    auth:enAuth,
    d_home: enDhome
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang") || "uz",
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

export default i18n;
