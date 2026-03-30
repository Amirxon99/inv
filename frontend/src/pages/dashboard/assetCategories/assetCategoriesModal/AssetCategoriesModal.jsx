import React, { useEffect, useState } from "react";
import styles from "./assetCategoriesModal.module.css";
import axiosInstance from "../../../../api/axiosInstanse";
import { toast } from "react-toastify";

const AssetCategoriesModal = ({ onClose, category, onSuccess }) => {

  const isEdit = !!category;

  const [form, setForm] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    if (isEdit) {
      setForm({
        name: category.name || "",
        description: category.description || ""
      });
    }
  }, [category, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {

    if (!form.name.trim()) {
      toast.error("Iltimos, kategoriya nomini kiriting!");
      return;
    }

    try {

      if (isEdit) {
        await axiosInstance.put(`/asset-categories/${category.id}`, form);
        toast.success("Kategoriya yangilandi!");
      } else {
        await axiosInstance.post("/asset-categories", form);
        toast.success("Yangi kategoriya yaratildi!");
      }

      onSuccess();
      onClose();

    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  return (
    <div className={styles.modalOverlay}>

      <div className={styles.modal}>

        {/* HEADER */}
        <div className={styles.header}>
          <h2>
            {isEdit ? "Kategoriyani tahrirlash" : "Yangi kategoriya yaratish"}
          </h2>

          <button className={styles.closeBtn} onClick={onClose}>
            X
          </button>
        </div>

        {/* BODY */}
        <div className={styles.body}>

          <label>Kategoriya nomi</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Kategoriya nomi"
          />

          <label>Tavsif</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Kategoriya tavsifi"
          />

        </div>

        {/* FOOTER */}
        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSubmit}>
            Saqlash
          </button>

          <button className={styles.cancelBtn} onClick={onClose}>
            Bekor qilish
          </button>
        </div>

      </div>

    </div>
  );
};

export default AssetCategoriesModal;