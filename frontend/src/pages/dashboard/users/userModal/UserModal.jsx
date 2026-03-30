import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../api/axiosInstanse";
import styles from "./userModal.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const UsersModal = ({ onClose, user, onSuccess, departmentList }) => {
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    role: "employee",
    department_id: null, // department_name o‘rniga id
    room_id: null,
    campus: "campus1",
  });

  const [rooms, setRooms] = useState([]);
  const isEdit = !!user;

  // Barcha xonalarni olish
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await axiosInstance.get("/rooms/list?size=100");
        setRooms(data.content || []);
      } catch (err) {
        toast.error("Xonalar ro'yxatini olishda xatolik yuz berdi");
      }
    };
    fetchRooms();
  }, []);

  // Edit holatda formni to‘ldirish
  useEffect(() => {
    if (isEdit && user) {
      setForm({
        username: user.username || "",
        password: "",
        first_name: user.first_name || "",
        middle_name: user.middle_name || "",
        last_name: user.last_name || "",
        role: user.role || "employee",
        department_id: user.department_id || null,
        room_id: user.room_id || null,
        campus: user.campus || "campus1",
      });
    }
  }, [user, isEdit]);

  const handleChange = (e, field) => {
    const value = e.target.value;
    if (field === "campus") {
      setForm((prev) => ({ ...prev, campus: value, room_id: null }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
      };
      if (isEdit) {
        await axiosInstance.put(`/users/update/${user.id}`, payload);
        toast.success("Foydalanuvchi yangilandi!");
      } else {
        await axiosInstance.post("/users/create", payload);
        toast.success("Foydalanuvchi yaratildi!");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  // Campus-ga bog‘liq xonalar
  const filteredRooms = rooms.filter((room) => room.campus === form.campus);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{isEdit ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi yaratish"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>

        <div className={styles.body}>
          <label>Username</label>
          <input type="text" value={form.username} onChange={(e) => handleChange(e, "username")} />

          {!isEdit && (
            <>
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => handleChange(e, "password")} />
            </>
          )}

          <label>First Name</label>
          <input value={form.first_name} onChange={(e) => handleChange(e, "first_name")} />

          <label>Middle Name</label>
          <input value={form.middle_name || ""} onChange={(e) => handleChange(e, "middle_name")} />

          <label>Last Name</label>
          <input value={form.last_name} onChange={(e) => handleChange(e, "last_name")} />

          <div className={styles.selectBox}>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={(e) => handleChange(e, "role")}>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label>Campus</label>
              <select value={form.campus} onChange={(e) => handleChange(e, "campus")}>
                <option value="campus1">Campus 1</option>
                <option value="campus2">Campus 2</option>
              </select>
            </div>
          </div>

          <div className={styles.complete_box}>
            <div>
              <label>Department</label>
              <Autocomplete
                options={[{ id: null, name: "Boshqa bo‘lim" }, ...departmentList]}
                getOptionLabel={(option) => option.name || ""}
                value={departmentList.find(d => d.id === form.department_id) || { id: null, name: "Boshqa bo‘lim" }}
                onChange={(e, value) =>
                  setForm((prev) => ({ ...prev, department_id: value?.id || null }))
                }
                renderInput={(params) => <TextField {...params} label="Department" fullWidth />}
              />
            </div>

            <div>
              <label>Xona</label>
              <Autocomplete
                options={filteredRooms}
                getOptionLabel={(room) => `${room.name} (${room.floor}-qavat)`}
                value={filteredRooms.find((r) => r.id === form.room_id) || null}
                onChange={(e, value) => setForm({ ...form, room_id: value?.id || null })}
                renderInput={(params) => <TextField {...params} label="Xonani tanlang" fullWidth />}
                disabled={!form.campus}
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSubmit}>Saqlash</button>
          <button className={styles.cancelBtn} onClick={onClose}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
};

export default UsersModal;