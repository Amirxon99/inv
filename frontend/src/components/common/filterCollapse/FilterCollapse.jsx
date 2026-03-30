import  { useState, useEffect } from "react";
import styles from "./filter.module.css";

const FilterCollapse = ({ onFilter, initial }) => {
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({
    dateFrom: "",
    dateTo: "",
    status: "Barchasi",
    fromOrg: "",
    toManager: "",
    number: "",
  });

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial]);

  const apply = (e) => {
    e && e.preventDefault();
    onFilter(form);
  };

  const reset = () => {
    const cleared = {
      dateFrom: "",
      dateTo: "",
      status: "Barchasi",
      fromOrg: "",
      toManager: "",
      number: "",
    };
    setForm(cleared);
    onFilter(cleared);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <button className={styles.toggle} onClick={() => setOpen((s) => !s)}>
          {open ? "Filtrlarni yopish ▲" : "Filtrlarni ochish ▼"}
        </button>
        <div className={styles.actions}>
          <button onClick={apply} className={styles.apply}>Qo'llash</button>
          <button onClick={reset} className={styles.reset}>Tozalash</button>
        </div>
      </div>

      {open && (
        <form className={styles.form} onSubmit={apply}>
          <div className={styles.row}>
            <label>
              Boshlang'ich sana
              <input
                type="date"
                value={form.dateFrom}
                onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
              />
            </label>

            <label>
              Tugash sana
              <input
                type="date"
                value={form.dateTo}
                onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Barchasi</option>
                <option>Jarayonda</option>
                <option>Bajarilgan</option>
                <option>Rad etilgan</option>
              </select>
            </label>
          </div>

          <div className={styles.row}>
            <label>
              Kimdan (Tashkilot)
              <input
                placeholder="Tashkilot nomi..."
                value={form.fromOrg}
                onChange={(e) => setForm({ ...form, fromOrg: e.target.value })}
              />
            </label>

            <label>
              Kimga (Rahbar)
              <input
                placeholder="Rahbar ismi..."
                value={form.toManager}
                onChange={(e) => setForm({ ...form, toManager: e.target.value })}
              />
            </label>

            <label>
              Hujjat raqami
              <input
                placeholder="raqam..."
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </label>
          </div>
        </form>
      )}
    </div>
  );
};

export default FilterCollapse;
