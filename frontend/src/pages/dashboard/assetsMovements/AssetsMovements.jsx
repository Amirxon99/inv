import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./assetsMovements.module.css";
import { toast } from "react-toastify";
import { FaSort, FaSortUp, FaSortDown, FaAngleDoubleLeft, FaAngleLeft, FaAngleRight, FaAngleDoubleRight } from "react-icons/fa";

const AssetsMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);
  const formatPrice = (value, currency = "so'm") => {
    if (value === null || value === undefined || value === "") return "-";

    const number = Number(value);

    if (isNaN(number)) return "-";

    return (
      new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(number) + ` ${currency}`
    );
  };
  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const sortQuery = sortConfig.key
        ? `${sortConfig.key},${sortConfig.direction}`
        : "moved_at,desc";

      const params = { page, size, sort: sortQuery };
      if (query) params.q = query;

      const queryString = new URLSearchParams(params).toString();
      const { data: res } = await axiosInstance.get(`/assets-movements?${queryString}`);

      if (res.content) {
        setMovements(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.total || 0);
      } else setError("Ma'lumot kelmadi");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server xatoligi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, size, sortConfig, query]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const getVisiblePages = () => {
    const delta = 2;
    let start = Math.max(0, page - delta);
    let end = Math.min(totalPages - 1, page + delta);
    if (page <= delta) end = Math.min(4, totalPages - 1);
    if (page + delta >= totalPages - 1) start = Math.max(0, totalPages - 5);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  const columns = [
    { label: "№", key: "id" },
    { label: "Aktiv nomi", key: "asset_name" },
    { label: "Inventory №", key: "inv_number" },
    { label: "Narxi", key: "price" },
    { label: "Qaysi xonadan", key: "from_room_name" },
    { label: "Qaysi xonaga", key: "to_room_name" },
    { label: "Kim ko'chirdi", key: "moved_by_name" },
    { label: "Qachon ko'chgani", key: "moved_at" },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.paginationInfo}>
          Ko‘rsatilmoqda <span>{startItem}</span>-<span>{endItem}</span> (Jami: <span>{totalElements}</span>)
        </div>
        <div className={styles.pageCount}>
          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Qidirish..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.input}
        />
        <select
          value={size}
          onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
          className={styles.select}
        >
          {[5,10,20,50].map(s => <option key={s} value={s}>{s}/page</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loaderWrapper}><div className={styles.loader}></div></div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} className={styles.sortable}>
                  {col.label}
                  {sortConfig.key === col.key
                    ? sortConfig.direction === "asc"
                      ? <FaSortUp />
                      : <FaSortDown />
                    : <FaSort />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map((mov, i) => (
              <tr key={mov.id}>
                <td>{startItem + i}</td>
                <td>{mov.asset_name}</td>
                <td>{mov.inv_number}</td>
                <td>{formatPrice(mov.price)}</td>
                <td>{mov.from_room_name || "-"}</td>
                <td>{mov.to_room_name || "-"}</td>
                <td>{mov.moved_by_name || "-"}</td>
                <td>{new Date(mov.moved_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className={styles.pagination}>
        <button disabled={page===0} onClick={() => setPage(0)} className={styles.nav}><FaAngleDoubleLeft /></button>
        <button disabled={page===0} onClick={() => setPage(page-1)} className={styles.nav}><FaAngleLeft /></button>
        {getVisiblePages().map(p => (
          <button key={p} onClick={() => setPage(p)} className={`${styles.pageBtn} ${page===p ? styles.active : ""}`}>{p+1}</button>
        ))}
        <button disabled={page+1>=totalPages} onClick={() => setPage(page+1)} className={styles.nav}><FaAngleRight /></button>
        <button disabled={page+1>=totalPages} onClick={() => setPage(totalPages-1)} className={styles.nav}><FaAngleDoubleRight /></button>
      </div>
    </div>
  );
};

export default AssetsMovements;