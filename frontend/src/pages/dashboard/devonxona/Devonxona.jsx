import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./devonxona.module.css";
import { toast } from "react-toastify";
import {
  FaBoxes,
  FaUsers,
  FaDoorOpen,
  FaBuilding,
  FaExclamationTriangle,
} from "react-icons/fa";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#00C49F", "#FF8042", "#FFBB28", "#0088FE", "#FF4444"];

const Devonxona = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/");
      setData(data);
    } catch {
      toast.error("Dashboard yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <div className={styles.loader}>Loading...</div>;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <div className={styles.header}>
        <h2>Dashboard</h2>
        <p>Tizim statistikasi va nazorat paneli</p>
      </div>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <FaBoxes /> {data.kpi.assets}
          <span>Jihozlar</span>
        </div>
        <div className={styles.card}>
          <FaUsers /> {data.kpi.users}
          <span>Xodimlar</span>
        </div>
        <div className={styles.card}>
          <FaDoorOpen /> {data.kpi.rooms}
          <span>Xonalar</span>
        </div>
        <div className={styles.card}>
          <FaBuilding /> {data.kpi.departments}
          <span>Bo‘limlar</span>
        </div>
      </div>

      {/* CHARTS */}
      <div className={styles.chartsGrid}>
        {/* Asset Status */}
        <div className={styles.chartCard}>
          <h3>Jihoz holati</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.assetStatus}
                dataKey="count"
                nameKey="status"
                outerRadius={80}
              >
                {data.assetStatus.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Results */}
        <div className={styles.chartCard}>
          <h3>Inventarizatsiya natijasi</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.inventoryResults}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT MOVEMENTS */}
      <div className={styles.tableCard}>
        <h3>Oxirgi harakatlar</h3>
        <table>
          <thead>
            <tr>
              <th>Jihoz</th>
              <th>Qayerdan</th>
              <th>Qayerga</th>
              <th>Foydalanuvchi</th>
              <th>Vaqt</th>
            </tr>
          </thead>
          <tbody>
            {data.recentMovements.map((m) => (
              <tr key={m.id}>
                <td>{m.asset_name}</td>
                <td>{m.from_room || "-"}</td>
                <td>{m.to_room || "-"}</td>
                <td>{m.first_name || "-"}</td>
                <td>{new Date(m.moved_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALERT */}
      {data.notFoundAssets.length > 0 && (
        <div className={styles.alertBox}>
          <FaExclamationTriangle />
          <div>
            <strong>Topilmagan jihozlar mavjud!</strong>
            <p>{data.notFoundAssets.length} ta jihoz topilmadi</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Devonxona;