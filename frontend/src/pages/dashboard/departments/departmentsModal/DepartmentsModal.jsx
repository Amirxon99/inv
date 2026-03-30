import React, { useEffect, useState } from "react";
import styles from "./departmentsModal.module.css";
import axiosInstance from "../../../../api/axiosInstanse";
import { toast } from "react-toastify";

const DepartmentsModal = ({ onClose, department, onSuccess }) => {
  const isEdit = !!department;

  const [form, setForm] = useState({ name: "" });

  useEffect(() => {
    if (isEdit) {
      setForm({ name: department.name || "" });
    }
  }, [department, isEdit]);

  const handleChange = (e) => {
    setForm({ name: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Iltimos, bo‘lim nomini kiriting!");
      return;
    }

    try {
      if (isEdit) {
        await axiosInstance.put(`/departments/${department.id}`, form);
        toast.success("Bo‘lim yangilandi!");
      } else {
        await axiosInstance.post("/departments", form);
        toast.success("Yangi bo‘lim yaratildi!");
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
        <div className={styles.header}>
          <h2>{isEdit ? "Bo‘limni tahrirlash" : "Yangi bo‘lim yaratish"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>

        <div className={styles.body}>
          <label>Bo‘lim nomi</label>
          <input type="text" value={form.name} onChange={handleChange} placeholder="Bo‘lim nomi" />
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSubmit}>Saqlash</button>
          <button className={styles.cancelBtn} onClick={onClose}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsModal;