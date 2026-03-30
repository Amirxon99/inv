import React, { useState, useMemo } from "react";
import styles from "./documentTable.module.css";

const DocumentTable = ({ data = [], perPage = 10 }) => {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / perPage));

  // ensure page valid when data changes
  if (page > totalPages) setTimeout(() => setPage(1), 0);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, page, perPage]);

  const pageNumbers = [];
  const maxButtons = 7;
  let start = Math.max(1, page - 3);
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        <div>Ko'rsatilmoqda: <strong>{(page - 1) * perPage + 1}</strong> dan <strong>{Math.min(page * perPage, data.length)}</strong> gacha (Jami: <strong>{data.length}</strong>)</div>
        <div className={styles.controls}>
          <label className={styles.perPage}>
            Har sahifada:
            <select
              value={perPage}
              onChange={() => {}}
              disabled
              title="Default perPage set by parent"
            >
              <option>10</option>
            </select>
          </label>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Raqami</th>
            <th>Sana</th>
            <th>Tashkilot</th>
            <th>Chiquvchi raqami</th>
            <th>Qisqacha mazmuni</th>
            <th>Rahbar</th>
            <th>Ijro uchun mas'ul</th>
            <th>Ijro muddati</th>
            <th>Holat</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((d, idx) => (
            <tr key={d.id}>
              <td>{(page - 1) * perPage + idx + 1}</td>
              <td>
                <span className={styles.badge}>{d.number}</span>
              </td>
              <td>{d.date}</td>
              <td className={styles.org}>{d.organization}</td>
              <td>{d.outNumber}</td>
              <td className={styles.summary}>{d.summary}</td>
              <td>{d.manager}</td>
              <td>{d.executor}</td>
              <td>{d.deadline}</td>
              <td>
                <span className={`${styles.status} ${styles[d.statusClass]}`}>
                  {d.status}
                </span>
              </td>
            </tr>
          ))}

          {paginated.length === 0 && (
            <tr>
              <td colSpan={10} className={styles.empty}>Natija topilmadi.</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button onClick={() => setPage(1)} disabled={page === 1} className={styles.nav}>«</button>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={styles.nav}>‹</button>

        {pageNumbers[0] > 1 && <span className={styles.ellipsis}>…</span>}
        {pageNumbers.map((p) => (
          <button
            key={p}
            className={`${styles.pageBtn} ${p === page ? styles.active : ""}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        {pageNumbers[pageNumbers.length - 1] < totalPages && <span className={styles.ellipsis}>…</span>}

        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={styles.nav}>›</button>
        <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className={styles.nav}>»</button>
      </div>
    </div>
  );
};

export default DocumentTable;
