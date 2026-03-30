import React, { useEffect, useState } from "react";
import axiosInstance from "../../../../api/axiosInstanse";
import { toast } from "react-toastify";
import styles from "./assetsModal.module.css";

import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";

const AssetsModal = ({ onClose, asset, onSuccess, roomsList, departmentsList, categoriesList }) => {
  const isEdit = !!asset;

  const [form, setForm] = useState({
    name: "",
    inv_number: "",
    status: "new",
    type: "permanent",
    room_id: null,
    price: "",
    department_id: null,
    category_id: null, // ✅ category qo‘shildi
    quantity: 1,
  });

  const [filteredRooms, setFilteredRooms] = useState([]);

  // Fill form if editing
  useEffect(() => {
    if (isEdit && asset) {
      setForm({
        name: asset.name || "",
        inv_number: asset.inv_number || "",
        status: asset.status || "new",
        type: asset.type || "permanent",
        room_id: asset.room_id || null,
        price: asset.price || "",
        department_id: asset.department_id || null,
        category_id: asset.category_id || null,
        quantity: 1,
      });
    }
  }, [asset, isEdit]);

  // Filter rooms based on selected department
  useEffect(() => {
    if (form.department_id) {
      setFilteredRooms(
        roomsList.filter((r) => r.department_id === form.department_id)
      );
    } else {
      setFilteredRooms(roomsList);
    }
  }, [form.department_id, roomsList]);

  // Handle form changes
  const handleChange = (e, field) => {
    let value = e.target.value;
    if (field === "price" || field === "quantity") {
      value = value === "" ? "" : Number(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.inv_number) {
      toast.error("Iltimos, nom va inventory № ni kiriting!");
      return;
    }

    try {
      const payload = { ...form };
      if (isEdit) {
        await axiosInstance.put(`/assets/update/id/${asset.id}`, payload);
        toast.success("Asset yangilandi!");
      } else {
        await axiosInstance.post("/assets", payload);
        toast.success("Assetlar yaratildi!");
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
          <h2>{isEdit ? "Assetni tahrirlash" : "Yangi asset yaratish"}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>

        <div className={styles.body}>
          <label>Name</label>
          <TextField
            value={form.name}
            onChange={(e) => handleChange(e, "name")}
            placeholder="Asset nomi"
            fullWidth
          />

          <label>Inventory №</label>
          <TextField
            value={form.inv_number}
            onChange={(e) => handleChange(e, "inv_number")}
            placeholder="Inventory raqam"
            fullWidth
          />

          {!isEdit && (
            <>
              <label>Quantity</label>
              <TextField
                type="number"
                value={form.quantity}
                onChange={(e) => handleChange(e, "quantity")}
                placeholder="Nechta asset yaratish"
                fullWidth
                inputProps={{ min: 1 }}
              />
            </>
          )}

          <label>Status</label>
          <TextField
            select
            SelectProps={{ native: true }}
            value={form.status}
            onChange={(e) => handleChange(e, "status")}
            fullWidth
          >
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="repair">Repair</option>
            <option value="written_off">Written off</option>
          </TextField>

          <label>Type</label>
          <TextField
            select
            SelectProps={{ native: true }}
            value={form.type}
            onChange={(e) => handleChange(e, "type")}
            fullWidth
          >
            <option value="permanent">Permanent</option>
            <option value="temporary">Temporary</option>
          </TextField>

          <label>Department</label>
          <Autocomplete
            options={[{ id: null, name: "Boshqasi" }, ...departmentsList]}
            getOptionLabel={(option) => option.name || ""}
            value={departmentsList.find(d => d.id === form.department_id) || { id: null, name: "Boshqasi" }}
            onChange={(e, value) =>
              setForm((prev) => ({ ...prev, department_id: value?.id || null, room_id: null }))
            }
            renderInput={(params) => <TextField {...params} label="Department" fullWidth />}
          />

          <label>Room</label>
          <Autocomplete
            options={[{ id: null, name: "Barchasi" }, ...filteredRooms]}
            getOptionLabel={(room) => room.name ? `${room.name} (${room.campus})` : "Barchasi"}
            value={filteredRooms.find((r) => r.id === form.room_id) || { id: null, name: "Barchasi" }}
            onChange={(e, value) =>
              setForm((prev) => ({ ...prev, room_id: value?.id || null }))
            }
            renderInput={(params) => <TextField {...params} label="Room" fullWidth />}
          />

          {/* ✅ Category */}
          <label>Category</label>
          <Autocomplete
            options={[{ id: null, name: "Barchasi" }, ...categoriesList]}
            getOptionLabel={(option) => option.name || ""}
            value={categoriesList.find(c => c.id === form.category_id) || { id: null, name: "Barchasi" }}
            onChange={(e, value) =>
              setForm((prev) => ({ ...prev, category_id: value?.id || null }))
            }
            renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
          />

          <label>Price</label>
          <TextField
            type="number"
            value={form.price || ""}
            onChange={(e) => handleChange(e, "price")}
            placeholder="Price"
            fullWidth
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSubmit}>Saqlash</button>
          <button className={styles.cancelBtn} onClick={onClose}>Bekor qilish</button>
        </div>
      </div>
    </div>
  );
};

export default AssetsModal;