import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Redux ishlatayotganingiz uchun
import axiosInstance from "../../../api/axiosInstanse";
import { toast } from "react-toastify";

import { 
  TextField, Autocomplete, Button, CircularProgress, 
  Paper, Divider, Typography, Box 
} from "@mui/material";
import { FaEdit, FaLock, FaSignInAlt, FaInfoCircle } from "react-icons/fa";

import styles from "./singleAssetView.module.css";

const SingleAssetView = () => {
  const { qr_token } = useParams();
  const navigate = useNavigate();
  
  // Redux-dan foydalanuvchi holatini tekshirish
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = !!user;

  const [asset, setAsset] = useState(null);
  const [roomsList, setRoomsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    status: "",
    department_id: null,
    room_id: null,
    notes: ""
  });

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const res = await axiosInstance.get(`/assets/view/${qr_token}`);
        const { asset, roomsList, departmentsList } = res.data;

        setAsset(asset);
        setRoomsList(roomsList);
        setDepartmentsList(departmentsList);

        setForm({
          status: asset.status,
          department_id: asset.department_id,
          room_id: asset.room_id,
          notes: asset.notes || ""
        });
      } catch (err) {
        toast.error("Ma'lumot topilmadi");
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [qr_token]);

  useEffect(() => {
    if (form.department_id) {
      setFilteredRooms(
        roomsList.filter((room) => room.department_id === form.department_id)
      );
    } else {
      setFilteredRooms(roomsList);
    }
  }, [form.department_id, roomsList]);

  const formatPrice = (value) => {
    if (!value) return "0.00 so'm";
    return new Intl.NumberFormat("ru-RU").format(value) + " so'm";
  };

  const handleUpdate = async () => {
    try {
      await axiosInstance.put(`/assets/update/qr/${qr_token}`, {
        status: form.status,
        department_id: form.department_id,
        room_id: form.room_id,
        notes: form.notes || null
      });
      toast.success("Ma'lumotlar yangilandi!");
      setAsset((prev) => ({ ...prev, ...form }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Yangilashda xatolik");
    }
  };

  if (loading) return <div className={styles.centered}><CircularProgress /></div>;
  if (!asset) return <div className={styles.centered}><p>Jihoz topilmadi</p></div>;

  return (
    <div className={styles.wrapper}>
      <Paper elevation={0} className={styles.container}>
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.qrIcon}><FaInfoCircle /></div>
          <h2>{asset.name}</h2>
          <Typography variant="body2" color="textSecondary">
            ID: {asset.inv_number}
          </Typography>
        </div>

        <Divider sx={{ my: 3 }} />

        {/* INFO GRID (Hamma uchun ko'rinadi) */}
        <Box className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span>Narxi:</span>
            <strong>{formatPrice(asset.price)}</strong>
          </div>
          <div className={styles.infoItem}>
            <span>Joriy holat:</span>
            <span className={`${styles.statusBadge} ${styles[asset.status]}`}>
              {asset.status.toUpperCase()}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span>Bo'lim:</span>
            <strong>{asset.department_name || "Mavjud emas"}</strong>
          </div>
          <div className={styles.infoItem}>
            <span>Xona:</span>
            <strong>{asset.room_name || "Mavjud emas"}</strong>
          </div>
        </Box>

        {/* ACTIONS SECTION */}
        <Box sx={{ mt: 4 }}>
          {isAuthenticated ? (
            /* ADMIN MODE: O'zgartirish formasi */
            <div className={styles.adminPanel}>
              <Typography className={styles.sectionTitle}>
                <FaEdit /> Tahrirlash (Admin)
              </Typography>

              <div className={styles.field}>
                <label className={styles.label}>Holatni o'zgartirish</label>
                <TextField
                  select
                  fullWidth
                  SelectProps={{ native: true }}
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value})}
                >
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="repair">Repair</option>
                  <option value="not_found">Not found</option>
                </TextField>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Department</label>
                <Autocomplete
                  options={departmentsList}
                  getOptionLabel={(opt) => opt.name || ""}
                  value={departmentsList.find((d) => d.id === form.department_id) || null}
                  onChange={(e, v) => setForm({...form, department_id: v?.id, room_id: null})}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Room</label>
                <Autocomplete
                  options={filteredRooms}
                  getOptionLabel={(r) => `${r.name} (${r.campus})`}
                  value={filteredRooms.find((r) => r.id === form.room_id) || null}
                  onChange={(e, v) => setForm({...form, room_id: v?.id})}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Notes</label>
                <TextField
                  multiline
                  rows={2}
                  fullWidth
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                />
              </div>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdate}
                className={styles.updateBtn}
              >
                Saqlash
              </Button>
            </div>
          ) : (
            /* GUEST MODE: Kirish tugmasi */
            <div className={styles.guestPanel}>
              <div className={styles.lockBox}>
                <FaLock />
                <Typography variant="body2">
                  Tahrirlash uchun tizimga kirish talab etiladi
                </Typography>
              </div>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FaSignInAlt />}
                onClick={() => navigate("/login")}
                className={styles.loginBtn}
              >
                Tizimga Kirish
              </Button>
            </div>
          )}
        </Box>
      </Paper>
    </div>
  );
};

export default SingleAssetView;