import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./departments.module.css";
import { useSelector } from "react-redux";
import {
  FaEdit,
  FaTrash,
  FaAngleDoubleLeft,
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleRight,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import DepartmentsModal from "./departmentsModal/DepartmentsModal";
import { toast } from "react-toastify";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lang = useSelector((state) => state.auth.lang);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const sortQuery = sortConfig.key
        ? `${sortConfig.key},${sortConfig.direction}`
        : "id,asc";

      const params = { page, size, sort: sortQuery };
      if (query) params.q = query;

      const queryString = new URLSearchParams(params).toString();
      const { data: res } = await axiosInstance.get(`/departments/list?${queryString}`);

      if (res.content) {
        setDepartments(res.content || []);
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
    fetchDepartments();
  }, [page, size, sortConfig, query, lang]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const deleteDepartment = async (id) => {
    const confirmDelete = window.confirm("Bo‘limni o‘chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/departments/${id}`);
      toast.success("Bo‘lim muvaffaqiyatli o‘chirildi ✅");
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "O‘chirishda xatolik yuz berdi ❌");
    }
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
    { label: "Bo‘lim nomi", key: "name" },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.paginationInfo}>
          Ko‘rsatilmoqda <span>{startItem}</span>-<span>{endItem}</span> (Jami: <span>{totalElements}</span>)
        </div>
        <div className={styles.pageCount}>
          <button
            className={styles.createBtn}
            onClick={() => { setSelectedDepartment(null); setModalOpen(true); }}
          >
            Bo‘lim qo‘shish
          </button>
          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Bo‘lim nomi..."
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dep, i) => (
              <tr key={dep.id}>
                <td>{startItem + i}</td>
                <td>{dep.name}</td>
                <td className={styles.actions}>
                  <button className={styles.edit} onClick={() => { setSelectedDepartment(dep); setModalOpen(true); }}>
                    <FaEdit />
                  </button>
                  <button className={styles.delete} onClick={() => deleteDepartment(dep.id)}>
                    <FaTrash />
                  </button>
                </td>
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

      {modalOpen && (
        <DepartmentsModal
          onClose={() => setModalOpen(false)}
          department={selectedDepartment}
          onSuccess={fetchDepartments}
        />
      )}
    </div>
  );
};

export default Departments;