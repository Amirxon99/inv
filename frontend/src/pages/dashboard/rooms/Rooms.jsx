import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./room.module.css";
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
import RoomModal from "./roomModal/RoomsModal";
import { toast } from "react-toastify";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
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

  // 🔥 FILTER STATES
  const [campusFilter, setCampusFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [departmentList, setDepartmentList] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const sortQuery = sortConfig.key
        ? `${sortConfig.key},${sortConfig.direction}`
        : "id,asc";

      const params = { page, size, sort: sortQuery };
      if (query) params.q = query;
      if (campusFilter) params.campus = campusFilter;
      if (floorFilter) params.floor = floorFilter;
      if (typeFilter) params.type = typeFilter;
      if (departmentFilter) params.department = departmentFilter;

      const queryString = new URLSearchParams(params).toString();
      const { data: res } = await axiosInstance.get(`/rooms/list?${queryString}`);

      if (res.content) {
        setRooms(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.total || 0);

        // Department list for select
        setDepartmentList(res.departmentList || []);
      } else setError("Ma'lumot kelmadi");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server xatoligi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, size, sortConfig, query, campusFilter, floorFilter, typeFilter, departmentFilter, lang]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const deleteRoom = async (id) => {
    const confirmDelete = window.confirm("Xonani o‘chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/rooms/${id}`);
      toast.success("Xona muvaffaqiyatli o‘chirildi ✅");
      fetchRooms();
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
    { label: "Name", key: "name" },
    { label: "Floor", key: "floor" },
    { label: "Type", key: "type" },
    { label: "Campus", key: "campus" },
    { label: "Department", key: "department_name" },
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
            onClick={() => { setSelectedRoom(null); setModalOpen(true); }}
          >
            Xona qo‘shish
          </button>
          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Xona nomi, qavat..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.input}
        />

        <select
          value={campusFilter}
          onChange={(e) => { setCampusFilter(e.target.value); setPage(0); }}
          className={styles.select}
        >
          <option value="">Barcha bino</option>
          <option value="campus1">1-bino</option>
          <option value="campus2">2-bino</option>
        </select>

        <select
          value={floorFilter}
          onChange={(e) => { setFloorFilter(e.target.value); setPage(0); }}
          className={styles.select}
        >
          <option value="">Barcha qavat</option>
          {[0,1,2,3,4].map(f => <option key={f} value={f}>{f}-qavat</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className={styles.select}
        >
          <option value="">Barcha tur</option>
          <option value="room">Room</option>
          <option value="hall">Hall</option>
          <option value="other">Other</option>
          <option value="store">Store</option>
        </select>

        {/* Department Filter */}
        <select
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
          className={styles.select}
        >
          <option value="">Barcha bo‘limlar</option>
          {departmentList.map(dep => (
            <option key={dep.id || "null"} value={dep.id || "null"}>
              {dep.name || "Boshqa bo‘lim"}
            </option>
          ))}
        </select>

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
            {rooms.map((room, i) => (
              <tr key={room.id}>
                <td>{startItem + i}</td>
                <td>{room.name}</td>
                <td>{room.floor}</td>
                <td>{room.type}</td>
                <td>{room.campus.slice(-1)} - Bino</td>
                <td>{room.department_name || "Boshqa bo‘lim"}</td>
                <td className={styles.actions}>
                  <button className={styles.edit} onClick={() => { setSelectedRoom(room); setModalOpen(true); }}>
                    <FaEdit />
                  </button>
                  <button className={styles.delete} onClick={() => deleteRoom(room.id)}>
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
        <RoomModal
          onClose={() => setModalOpen(false)}
          room={selectedRoom}
          onSuccess={fetchRooms}
          departmentList={departmentList}
        />
      )}
    </div>
  );
};

export default Rooms;