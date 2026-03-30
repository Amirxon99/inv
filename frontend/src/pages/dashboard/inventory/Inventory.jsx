import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./inventory.module.css";
import { toast } from "react-toastify";
import { FaPlay, FaStop, FaQrcode, FaBuilding, FaSearch, FaCameraRetro, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import { Autocomplete, TextField, CircularProgress, Dialog, DialogTitle, DialogActions, Button } from "@mui/material";
import { Html5Qrcode } from "html5-qrcode";

const Inventory = () => {
  const [rooms, setRooms] = useState([]);
  const [campus, setCampus] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [session, setSession] = useState(null);
  const [assets, setAssets] = useState([]);
  const [qrToken, setQrToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [finishDialog, setFinishDialog] = useState(false);
  const [pendingFinishStats, setPendingFinishStats] = useState(null);

  const inputRef = useRef(null);
  const html5QrScanner = useRef(null);
  const lastScanRef = useRef(null);
  const isProcessingRef = useRef(false);

  // 🔄 1. Sahifa yuklanganda LocalStorage'dan sessiyani tekshirish
  useEffect(() => {
    fetchRooms();
    const savedSession = localStorage.getItem("inventory_session");
    if (savedSession) {
      const parsedSession = JSON.parse(savedSession);
      setSession(parsedSession);
      fetchAssets(parsedSession.id);
    }

    return () => {
      if (html5QrScanner.current) stopCamera();
    };
  }, []);

  const playSound = (type) => {
    const success = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    const error = new Audio("https://assets.mixkit.co/active_storage/sfx/2360/2360-preview.mp3");
    type === "success" ? success.play().catch(() => {}) : error.play().catch(() => {});
  };

  const fetchRooms = async () => {
    try {
      setFetchingRooms(true);
      const { data } = await axiosInstance.get("/rooms/list?limit=1000");
      setRooms(data.content || []);
    } catch {
      toast.error("Xonalarni yuklashda xato!");
    } finally {
      setFetchingRooms(false);
    }
  };

  const fetchAssets = async (sessionId) => {
    try {
      const { data } = await axiosInstance.get(`/inventory/${sessionId}/assets`);
      setAssets(data || []);
    } catch (err) {
      console.error("Asset yuklashda xato:", err);
    }
  };

  const startInventory = async () => {
    if (!selectedRoom) return toast.warning("Xonani tanlang!");
    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/inventory/start", {
        room_id: selectedRoom,
        year: new Date().getFullYear(),
      });

      setSession(data.session);
      // 💾 Sessiyani saqlash
      localStorage.setItem("inventory_session", JSON.stringify(data.session));
      
      fetchAssets(data.session.id);
      toast.success(data.message || "Inventarizatsiya boshlandi");
      setTimeout(() => inputRef.current?.focus(), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const scanAsset = async (token) => {
    if (!token || isProcessingRef.current) return;
    const trimmedToken = token.trim().split("/").pop();

    try {
      isProcessingRef.current = true;
      setScanning(true);
      const { data } = await axiosInstance.post("/inventory/scan", {
        session_id: session.id,
        qr_token: trimmedToken,
      });

      if (data.status === "already_scanned") {
        toast.info("Bu jihoz allaqachon skanerlangan");
      } else {
        if (data.is_extra) {
          toast.warning(`Diqqat! ${data.asset.name} boshqa xonadan keldi!`);
        } else {
          toast.success(`${data.asset.name} tasdiqlandi`);
        }
        playSound("success");
      }

      await fetchAssets(session.id);
      setQrToken("");
    } catch (err) {
      playSound("error");
      toast.error(err.response?.data?.message || "Skanerlashda xato");
      setQrToken("");
    } finally {
      setScanning(false);
      setTimeout(() => { isProcessingRef.current = false; }, 1000);
      inputRef.current?.focus();
    }
  };

  const handleFinishClick = async () => {
    if (cameraActive) await stopCamera();
    try {
      const { data } = await axiosInstance.post(`/inventory/finish/${session.id}`);
      setPendingFinishStats(data.stats);
      setFinishDialog(true);
    } catch {
      toast.error("Yakunlashda xatolik yuz berdi");
    }
  };

  const confirmFinish = () => {
    // 🗑️ LocalStorage'dan tozalash
    localStorage.removeItem("inventory_session");
    setSession(null);
    setAssets([]);
    setSelectedRoom("");
    setPendingFinishStats(null);
    setFinishDialog(false);
    toast.success("Sessiya muvaffaqiyatli yakunlandi va yopildi");
  };

  // Kamera funksiyalari (startCamera, stopCamera) o'zgarishsiz qoladi...
  const startCamera = async () => {
    setCameraActive(true);
    setTimeout(async () => {
      try {
        html5QrScanner.current = new Html5Qrcode("qr-reader");
        await html5QrScanner.current.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: 250 },
          (text) => {
            if (lastScanRef.current === text || isProcessingRef.current) return;
            lastScanRef.current = text;
            scanAsset(text);
            setTimeout(() => { lastScanRef.current = null; }, 3000);
          }
        );
      } catch (err) {
        setCameraActive(false);
        toast.error("Kamera xatosi");
      }
    }, 300);
  };

  const stopCamera = async () => {
    if (html5QrScanner.current) {
      await html5QrScanner.current.stop();
      setCameraActive(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <FaBuilding className={styles.mainIcon} />
          <div>
            <h2 className={styles.title}>Inventarizatsiyasi jarayoni</h2>
            <p className={styles.subtitle}>Filial: {campus || "Barchasi"}</p>
          </div>
        </div>
        {session && (
          <div className={styles.livePulse}>
            <span className={styles.dot}></span> SESSIYA FAOL: {session.room_name}
          </div>
        )}
      </div>

      {!session ? (
        <div className={styles.setupCard}>
          <div className={styles.setupGrid}>
             {/* Campus va Room tanlash qismi o'zgarishsiz qoladi */}
             <div className={styles.formGroup}>
                <label>Campus</label>
                <select className={styles.select} value={campus} onChange={(e) => setCampus(e.target.value)}>
                    <option value="">Hammasi</option>
                    <option value="campus1">Campus 1</option>
                    <option value="campus2">Campus 2</option>
                </select>
             </div>
             <div className={styles.formGroup}>
                <Autocomplete
                  options={rooms.filter(r => !campus || r.campus === campus)}
                  getOptionLabel={(opt) => `${opt.name} (${opt.floor}-qavat)`}
                  onChange={(e, val) => setSelectedRoom(val?.id || "")}
                  renderInput={(params) => <TextField {...params} label="Xona" variant="outlined" />}
                />
             </div>
             <button onClick={startInventory} className={styles.startBtn} disabled={loading}>
                {loading ? <CircularProgress size={20}/> : "Boshlash"}
             </button>
          </div>
        </div>
      ) : (
        <div className={styles.activeContent}>
          <div className={styles.scannerCard}>
            <div className={styles.qrInputWrapper}>
              <FaQrcode className={styles.qrIcon} />
              <input
                ref={inputRef}
                type="text"
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scanAsset(qrToken)}
                placeholder="QR kod..."
                className={styles.qrInput}
                autoFocus
              />
              <button onClick={cameraActive ? stopCamera : startCamera} className={styles.cameraBtn}>
                {cameraActive ? "Kamerani yopish" : "Kamera"}
              </button>
            </div>

            <div id="qr-reader" style={{ display: cameraActive ? "block" : "none", width: "100%", maxWidth: "400px", margin: "10px auto" }} />

            <div className={styles.sessionStats}>
              <div className={styles.statItem}>
                <span>Kutilgan: <strong>{assets.filter(a => a.is_expected).length}</strong></span>
                <span>Topildi: <strong style={{color: "green"}}>{assets.filter(a => a.is_expected && a.status !== 'not_found').length}</strong></span>
                <span>Boshqa xonadan: <strong style={{color: "blue"}}>{assets.filter(a => !a.is_expected).length}</strong></span>
              </div>
              <button onClick={handleFinishClick} className={styles.finishBtn}>Tugatish</button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Jihoz</th>
                  <th>Inv Raqami</th>
                  <th>Holat</th>
                  <th>Tur</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className={!a.is_expected ? styles.extraRow : (a.status === 'not_found' ? styles.missingRow : styles.foundRow)}>
                    <td>{a.name}</td>
                    <td>{a.inv_number}</td>
                    <td>
                        {a.status === 'not_found' ? "Topilmadi" : "Tasdiqlandi"}
                    </td>
                    <td>
                        {!a.is_expected ? 
                            <span className={styles.extraBadge}><FaExclamationCircle/> Boshqa xona</span> : 
                            <span className={styles.expectedBadge}><FaCheckCircle/> Kutilgan</span>
                        }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finish Summary Modal */}
      <Dialog open={finishDialog} onClose={() => setFinishDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Yakuniy Natijalar</DialogTitle>
        <div style={{ padding: "0 24px 20px" }}>
          {pendingFinishStats && (
            <div className={styles.statsContainer}>
              <p>Kutilgan jihozlar: <b>{pendingFinishStats.expected_total}</b></p>
              <p>Topildi: <b style={{color: "green"}}>{pendingFinishStats.found}</b></p>
              <p>Yo'qolgan: <b style={{color: "red"}}>{pendingFinishStats.missing}</b></p>
              <p>Boshqa xonadan qo'shildi: <b style={{color: "blue"}}>{pendingFinishStats.extra}</b></p>
            </div>
          )}
        </div>
        <DialogActions>
          <Button onClick={() => setFinishDialog(false)}>Bekor qilish</Button>
          <Button onClick={confirmFinish} color="primary" variant="contained">Tasdiqlash va Yopish</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Inventory;