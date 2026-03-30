import { useState } from "react";
import Sidebar from "../components/dashboard/sidebar/Sidebar";
import Navbar from "../components/dashboard/navbar/Navbar";
import styles from "./dashboardLayout.module.css";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  // Mobil menyuning ochiq yoki yopiqligini boshqaruvchi state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menyuni ochish/yopish funksiyasi
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar'ga holatni va uni o'zgartirish funksiyasini beramiz */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className={styles.main}>
        {/* Navbar'ga tugma bosilganda ishlashi uchun funksiyani beramiz */}
        <Navbar toggleMobileMenu={toggleMobileMenu} />
        
        <div className={styles.content}>
          <Outlet /> {/* Sahifalar shu yerda almashadi */}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;