import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../api/axiosInstanse";
import styles from "./userAssetsModal.module.css";
import { toast } from "react-toastify";

const UserAssetsModal = ({ user, onClose }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newInv, setNewInv] = useState("");

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/user-assets/${user.id}/assets`);
      setAssets(data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Assetlarni olishda xatolik ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [user]);

  const addAsset = async () => {
    if (!newInv) return toast.error("Inventory raqamini kiriting ❌");

    try {
      await axiosInstance.post(`/user-assets/${user.id}/assets`, { inv_number: newInv });
      toast.success("Asset biriktirildi ✅");
      setNewInv("");
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Biriktirishda xatolik ❌");
    }
  };

  const deleteAsset = async (assetId) => {
    const confirmDelete = window.confirm("Assetni o‘chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/user-assets/${user.id}/assets/${assetId}`);
      toast.success("Asset o‘chirildi ✅");
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.message || "O‘chirishda xatolik ❌");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{user.first_name} {user.last_name} assetlari</h2>

        {/* 🔹 Add asset */}
        <div className={styles.addAsset}>
          <input
            type="text"
            placeholder="Inv raqami"
            value={newInv}
            onChange={(e) => setNewInv(e.target.value)}
            className={styles.input}
          />
          <button onClick={addAsset} className={styles.addBtn}>Biriktirish</button>
        </div>

        {/* 🔹 Assetlar ro‘yxati */}
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : assets.length === 0 ? (
          <p>Assetlar mavjud emas</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>№</th>
                <th>Asset Name</th>
                <th>Inv Raqami</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, i) => (
                <tr key={asset.id}>
                  <td>{i + 1}</td>
                  <td>{asset.asset_name || "-"}</td>
                  <td>{asset.inv_number}</td>
                  <td>
                    <button className={styles.deleteBtn} onClick={() => deleteAsset(asset.id)}>
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default UserAssetsModal;