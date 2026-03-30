import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../../api/axiosInstanse";
import { logoutLocal } from "../../../store/slices/authSlice";

import styles from "./sidebar.module.css";
import {
  Home,
  Building,
  Computer,
  LogOut,
  Phone,
  ChevronDown,
  Users,
  Layers,
  Repeat,
  Menu, // Yangi qo'shildi
  X      // Yangi qo'shildi
} from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobil menyu uchun state
  const [openSub, setOpenSub] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useSelector((state) => state.auth.user);
  const userRoles = user
    ? Array.isArray(user.role)
      ? user.role
      : [user.role]
    : [];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen); // Mobil toggle funksiyasi

  // Sahifa o'zgarganda mobil menyuni yopish
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { id: "home", icon: <Home size={22} />, label: "Bosh sahifa", path: "/", roles: ["super_admin", "moderator", "admin"] },
    { id: "users", icon: <Users size={22} />, label: "Xodimlar", path: "/users", roles: ["super_admin", "moderator", "admin"] },
    { id: "room", icon: <Building size={22} />, label: "Xonalar", path: "/rooms", roles: ["super_admin", "moderator", "admin"] },
    {
      id: "assets",
      icon: <Computer size={22} />,
      label: "Qurilmalar",
      roles: ["super_admin", "moderator", "admin"],
      children: [
        { id: "all_assets", label: "Barcha qurilmalar", path: "/assets", roles: ["super_admin", "moderator", "admin"] },
        { id: "asset_categories", label: "Qurilmalar kategoriyasi", path: "/asset-categories", roles: ["super_admin", "moderator", "admin"] },
      ],
    },
    { id: "departments", icon: <Layers size={22} />, label: "Bo'limlar", roles: ["super_admin", "moderator", "admin"], path: "/departments" },
    { id: "assets_movements", icon: <Repeat size={22} />, label: "O'zgarishlar", path: "/assets-movements", roles: ["super_admin", "moderator", "admin"] },
    { id: "inventory", icon: <Building size={22} />, label: "Inventory", path: "/inventory", roles: ["super_admin", "moderator", "admin"] },
  ];

  const hasAccess = (itemRoles) => {
    if (!itemRoles || itemRoles.length === 0) return true;
    return itemRoles.some((role) => userRoles.includes(role));
  };

  const isParentActive = (item) => {
    if (item.path && location.pathname === item.path) return true;
    if (item.children) return item.children.some((child) => location.pathname.startsWith(child.path));
    return false;
  };

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => location.pathname.startsWith(child.path))) {
        setOpenSub(item.id);
      }
    });
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) await axiosInstance.post("/auth/logout", { refreshToken });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      dispatch(logoutLocal());
      navigate("/login");
    }
  };

  return (
    <>
      {/* 🔹 MOBIL HAMBURGER TUGMASI */}
      <button className={styles.mobileToggle} onClick={toggleMobileMenu}>
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* 🔹 MOBIL OVERLAY */}
      {isMobileOpen && <div className={styles.overlay} onClick={toggleMobileMenu} />}

      <aside className={`${styles.sidebar} ${!isOpen ? styles.closed : ""} ${isMobileOpen ? styles.mobileOpen : ""}`}>
        
        {/* TOGGLE (Faqat PC'da ko'rinadi) */}
        <button className={styles.toggleBtn} onClick={toggleSidebar}>
          {isOpen ? "<" : ">"}
        </button>

        {/* MENU */}
        <div className={styles.menu}>
          {menuItems.map((item) => {
            if (!hasAccess(item.roles)) return null;
            const visibleChildren = item.children?.filter((child) => hasAccess(child.roles)) || [];
            const parentActive = isParentActive(item);

            if (visibleChildren.length > 0) {
              return (
                <div key={item.id}>
                  <div
                    className={`${styles.item} ${parentActive ? styles.activeParent : ""}`}
                    onClick={() => setOpenSub(openSub === item.id ? null : item.id)}
                  >
                    {item.icon}
                    {(isOpen || isMobileOpen) && <span>{item.label}</span>}
                    {(isOpen || isMobileOpen) && (
                      <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${openSub === item.id ? styles.chevronOpen : ""}`}
                      />
                    )}
                  </div>

                  {openSub === item.id && (isOpen || isMobileOpen) &&
                    visibleChildren.map((child) => (
                      <div
                        key={child.id}
                        className={`${styles.subItem} ${location.pathname === child.path ? styles.activeChild : ""}`}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </div>
                    ))}
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`${styles.item} ${parentActive ? styles.activeParent : ""}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                {(isOpen || isMobileOpen) && <span>{item.label}</span>}
              </div>
            );
          })}
        </div>

        {/* BOTTOM */}
        <div className={styles.bottom}>
          <div className={styles.contact}>
            <Phone size={20} />
            {(isOpen || isMobileOpen) && <span>+998 55 500 30 02</span>}
          </div>

          <div className={styles.logout} onClick={handleLogout}>
            <LogOut size={20} />
            {(isOpen || isMobileOpen) && <span>Chiqish</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;