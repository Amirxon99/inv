import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "react-toastify";
import styles from "./qrCodeModal.module.css";

const QRCodeModal = ({ onClose, assets }) => {
  const [qrCodes, setQrCodes] = useState([]);

  const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

  // QR kodlarni generatsiya qilish
  useEffect(() => {
    const generateQRs = async () => {
      const codes = [];

      for (let asset of assets) {
        try {
          // QR ichida: link
          const qrContent = `${BASE_URL}/assets/view/${asset.qr_token}`;

          // 🔹 ErrorCorrectionLevel 'H' qo'shildi
          const url = await QRCode.toDataURL(qrContent, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'H', 
          });

          codes.push({ ...asset, qrUrl: url });
        } catch (err) {
          toast.error(`QR kod yaratishda xatolik: ${asset.name}`);
        }
      }

      setQrCodes(codes);
    };

    if (assets?.length) generateQRs();
  }, [assets, BASE_URL]);

  // PDF saqlash funksiyasi (Stiker printer uchun moslangan)
  const savePDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    
    // 🔹 Stiker o'lchami: 40x40 mm
    // 'p' - portrait, 'mm' - millimetr, [40, 40] - sahifa o'lchami
    const pdf = new jsPDF("p", "mm", [40, 40]);

    qrCodes.forEach((a, i) => {
      const qrSize = 30; // QR kod o'lchami (stiker ichida)
      const x = 5; // Markazlash uchun chapdan joy
      const y = 2; // Yuqoridan joy

      // QR rasm
      pdf.addImage(a.qrUrl, "PNG", x, y, qrSize, qrSize);

      // Inv ma'lumotlari
      pdf.setFontSize(7);
      const invLabel = `Inv: ${a.inv_number}`;
      const labelWidth = pdf.getTextWidth(invLabel);

      // Matnni QR kod ostiga markazlab joylashtirish
      pdf.text(invLabel, 20 - labelWidth / 2, y + qrSize + 4);

      // 🔹 Har bir assetdan keyin yangi sahifa ochish (oxirgisidan tashqari)
      if (i !== qrCodes.length - 1) {
        pdf.addPage([40, 40], "p");
      }
    });

    // Bugungi sana
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    pdf.save(`stiker_qrcodes_${yyyy}-${mm}-${dd}.pdf`);
    toast.success("Stikerlar PDF formatida tayyorlandi ✅");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Stikerlar uchun QR kodlar (40x40mm)</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.qrGrid}>
          {qrCodes.map((a) => (
            <div key={a.id} className={styles.qrCard}>
              <img
                src={a.qrUrl}
                alt={a.name}
                style={{ width: "90px", height: "90px" }}
              />
              <div className={styles.inv}>
                <div>
                  <strong>Inv</strong>
                </div>
                <div>{a.inv_number}</div>
              </div>
            </div>
          ))}
        </div>

        <button className={styles.pdfBtn} onClick={savePDF}>
          Stiker PDF (40x40mm) yuklash
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;