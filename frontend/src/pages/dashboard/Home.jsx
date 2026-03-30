import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstanse";
import styles from "./home.module.css";
import { toast } from "react-toastify";
import { 
  FaBoxes, FaUsers, FaDoorOpen, FaBuilding, 
  FaExclamationTriangle, FaHistory, FaCalendarAlt, FaInbox 
} from "react-icons/fa";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

// Diagramma uchun aniq ranglar (oq bo'lib qolmasligi uchun)
const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const Home = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 7 }, (_, i) => 2020 + i);

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/dashboard?year=${selectedYear}`);
      setData(data);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className={styles.loaderWrapper}>
      <div className={styles.spinner}></div>
    </div>
  );

  const renderEmptyState = (message) => (
    <div className={styles.emptyState}>
      <FaInbox size={40} />
      <p>{message || "Ma'lumot topilmadi"}</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1>Boshqaruv Paneli</h1>
          <p>{selectedYear}-yil statistik tahlili</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.yearSelector}>
            <FaCalendarAlt className={styles.calendarIcon} />
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}-yil</option>)}
            </select>
          </div>
          <div className={styles.dateBadge}>
            <span className={styles.dateMonth}>
              {new Date().toLocaleDateString('uz-UZ')}
            </span>
          </div>
        </div>
      </header>

      {!data ? (
        renderEmptyState(`${selectedYear}-yil uchun ma'lumot mavjud emas.`)
      ) : (
        <>
          {/* KPI CARDS */}
          <div className={styles.statsGrid}>
            <StatCard icon={<FaBoxes />} label="Jami Jihozlar" value={data.kpi.assets} color="#3b82f6" />
            <StatCard icon={<FaUsers />} label="Xodimlar" value={data.kpi.users} color="#10b981" />
            <StatCard icon={<FaDoorOpen />} label="Xonalar" value={data.kpi.rooms} color="#8b5cf6" />
            <StatCard icon={<FaBuilding />} label="Bo‘limlar" value={data.kpi.departments} color="#f59e0b" />
          </div>

          <div className={styles.mainGrid}>
            {/* PIE CHART */}
            <div className={styles.chartBox}>
              <h3 className={styles.chartTitle}>Jihozlar Holati</h3>
              {data.assetStatus?.length > 0 ? (
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.assetStatus}
                        cx="50%" cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                        stroke="none"
                      >
                        {data.assetStatus.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : renderEmptyState()}
            </div>

            {/* BAR CHART */}
            <div className={styles.chartBox}>
              <h3 className={styles.chartTitle}>Inventarizatsiya Natijalari</h3>
              {data.inventoryResults?.length > 0 ? (
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.inventoryResults}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '10px', border: 'none'}} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : renderEmptyState()}
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h3><FaHistory /> Harakatlar tarixi</h3>
            </div>
            {data.recentMovements?.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.customTable}>
                  <thead>
                    <tr>
                      <th>Jihoz nomi</th>
                      <th>Yo'nalish</th>
                      <th>Mas'ul shaxs</th>
                      <th>Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentMovements.map((m) => (
                      <tr key={m.id}>
                        <td className={styles.assetName}>{m.asset_name}</td>
                        <td>
                          <div className={styles.moveFlow}>
                            <span className={styles.locationTag}>{m.from_room || "Ombor"}</span>
                            <span className={styles.arrow}>→</span>
                            <span className={styles.locationTag}>{m.to_room}</span>
                          </div>
                        </td>
                        <td>{m.first_name}</td>
                        <td className={styles.timeText}>
                          {new Date(m.moved_at).toLocaleDateString('uz-UZ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : renderEmptyState("Harakatlar topilmadi")}
          </div>

          {/* ALERT SECTION */}
          {data.notFoundAssets?.length > 0 && (
            <div className={styles.warningAlert}>
              <FaExclamationTriangle className={styles.alertIcon} />
              <div className={styles.alertContent}>
                <h4>Diqqat! Topilmagan inventarlar</h4>
                <p>{data.notFoundAssets.length} ta jihoz identifikatsiya qilinmadi.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={styles.statCard} style={{ '--accent-color': color }}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statInfo}>
      <span className={styles.statLabel}>{label}</span>
      <h2 className={styles.statValue}>{value || 0}</h2>
    </div>
  </div>
);

export default Home;