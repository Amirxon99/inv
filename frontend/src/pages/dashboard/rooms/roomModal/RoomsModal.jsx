import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../api/axiosInstanse";
import styles from "./roomsModal.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RoomModal = ({ onClose, room, onSuccess, departmentList = [] }) => {

    const [form, setForm] = useState({
        name: "",
        floor: "",
        type: "room",
        campus: "campus1",
        department_id: null, // default null
    });

    const isEdit = !!room;

    useEffect(() => {
        if (isEdit && room) {
            setForm({
                name: room.name || "",
                floor: room.floor ?? "",
                type: room.type || "room",
                campus: room.campus || "campus1",
                department_id: room.department_id ?? null,
            });
        }
    }, [room, isEdit]);

    const handleChange = (e, field) => {
        let value = e.target.value;

        if (field === "floor") {
            value = value === "" ? "" : Number(value);
        }

        if (field === "department_id") {
            value = value === "" ? null : Number(value);
        }

        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async () => {

        if (!form.name || form.floor === "") {
            toast.error("Iltimos, barcha maydonlarni to‘ldiring!");
            return;
        }

        try {

            const payload = {
                ...form,
                floor: Number(form.floor),
                department_id: form.department_id ?? null,
            };

            if (isEdit) {
                await axiosInstance.put(`/rooms/${room.id}`, payload);
                toast.success("Xona yangilandi!");
            } else {
                await axiosInstance.post("/rooms", payload);
                toast.success("Yangi xona yaratildi!");
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
                    <h2>{isEdit ? "Xonani tahrirlash" : "Yangi xona yaratish"}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>X</button>
                </div>

                <div className={styles.body}>
                    <label>Name</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange(e, "name")}
                        placeholder="Xona nomi"
                    />

                    <div className={styles.selectBox}>

                        <div>
                            <label>Floor</label>
                            <select
                                value={form.floor}
                                onChange={(e) => handleChange(e, "floor")}
                            >
                                <option value="">Qavat tanlang</option>
                                {[0, 1, 2, 3, 4].map((f) => (
                                    <option key={f} value={f}>
                                        {f}-qavat
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Xona turini tanlang</label>
                            <select
                                value={form.type}
                                onChange={(e) => handleChange(e, "type")}
                            >
                                <option value="room">Xona</option>
                                <option value="hall">Zal</option>
                                <option value="other">Boshqa</option>
                                <option value="store">Ombor</option>
                            </select>
                        </div>

                        <div>
                            <label>Bino ni tanlang</label>
                            <select
                                value={form.campus}
                                onChange={(e) => handleChange(e, "campus")}
                            >
                                <option value="campus1">1-Bino</option>
                                <option value="campus2">2-Bino</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>Bo‘limni tanlang (ixtiyoriy)</label>
                        <select
                            value={form.department_id ?? ""}
                            onChange={(e) => handleChange(e, "department_id")}
                        >
                            <option value="">Bo‘limsiz</option>
                            {departmentList.map((dep) => (
                                <option key={dep.id} value={dep.id}>
                                    {dep.name}
                                </option>
                            ))}
                        </select>
                    </div>


                </div>

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

export default RoomModal;