import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./users.module.css";
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
import UsersModal from "./userModal/UserModal";
import UserAssetsModal from "./userAssetsModal/UserAssetsModal"; // 🔹 import qildik
import { toast } from "react-toastify";

const Users = () => {
  const [data, setData] = useState([]);
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [assetsModalOpen, setAssetsModalOpen] = useState(false); // 🔹 asset modal state
  const [assetUser, setAssetUser] = useState(null); // 🔹 modal uchun foydalanuvchi
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [departmentList, setDepartmentList] = useState([]);

  // 🔹 Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // 🔹 Fetch users + department list
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        size,
        sort: sortConfig.key ? `${sortConfig.key},${sortConfig.direction}` : "id,asc",
        q: query,
      });
      if (departmentFilter) params.append("department", departmentFilter);

      const { data: res } = await axiosInstance.get(`/users/list?${params.toString()}`);
      setData(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.total || 0);

      if (res.departmentList) {
        setDepartmentList(res.departmentList);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size, sortConfig, query, departmentFilter, lang]);

  // 🔹 Sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  // 🔹 Delete user
  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Foydalanuvchini o‘chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/users/${id}`);
      toast.success("Foydalanuvchi muvaffaqiyatli o‘chirildi ✅");
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "O‘chirishda xatolik yuz berdi ❌");
    }
  };

  // 🔹 Pagination helper
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
    { label: "First Name", key: "first_name" },
    { label: "Last Name", key: "last_name" },
    { label: "Middle Name", key: "middle_name" },
    { label: "Room", key: "room_name" },
    { label: "Department", key: "department_name" },
    { label: "Username", key: "username" },
    { label: "Role", key: "role" },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.paginationInfo}>
          Ko‘rsatilmoqda <span>{startItem}</span>-<span>{endItem}</span> (Jami: <span>{totalElements}</span>)
        </div>
        <div className={styles.pageCount}>
          <button
            className={styles.createBtn}
            onClick={() => { setSelectedUser(null); setModalOpen(true); }}
          >
            Foydalanuvchi qo‘shish
          </button>
          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* 🔹 Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Username, ism, familiya, xona..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.input}
        />
        <div className={styles.d_box}>
          <label htmlFor="department">Bo'lim:</label>
          <select
            value={departmentFilter || ""}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
            className={styles.select}
          >
            <option value="">Barcha bo‘limlar</option>
            {departmentList.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.name || "Boshqa bo‘lim"}
              </option>
            ))}
            <option value="null">Bo‘lim mavjud emas</option>
          </select>
        </div>
        <select
          value={size}
          onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
          className={styles.select}
        >
          {[5, 10, 20, 50].map((s) => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
      </div>

      {/* 🔹 Table */}
      {loading ? (
        <div className={styles.loaderWrapper}>
          <div className={styles.loader}></div>
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={styles.sortable}
                >
                  {col.label}
                  {sortConfig.key === col.key ? (sortConfig.direction === "asc" ? <FaSortUp /> : <FaSortDown />) : <FaSort />}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((user, i) => (
              <tr key={user.id}>
                <td>{startItem + i}</td>
                <td>{user.first_name || "-"}</td>
                <td>{user.last_name || "-"}</td>
                <td>{user.middle_name || "-"}</td>
                <td>{user.room_name || "-"}</td>
                <td>{user.department_name || "Bo‘lim mavjud emas"}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td className={styles.actions}>
                  <button
                    className={styles.edit}
                    onClick={() => { setSelectedUser(user); setModalOpen(true); }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={styles.delete}
                    onClick={() => deleteUser(user.id)}
                  >
                    <FaTrash />
                  </button>
                  {/* 🔹 Assets modal tugmasi */}
                  <button
                    className={styles.edit}
                    onClick={() => { setAssetUser(user); setAssetsModalOpen(true); }}
                  >
                    Assets
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 🔹 Pagination */}
      <div className={styles.pagination}>
        <button disabled={page === 0} onClick={() => setPage(0)} className={styles.nav}><FaAngleDoubleLeft /></button>
        <button disabled={page === 0} onClick={() => setPage(page - 1)} className={styles.nav}><FaAngleLeft /></button>
        {getVisiblePages().map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}>
            {p + 1}
          </button>
        ))}
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} className={styles.nav}><FaAngleRight /></button>
        <button disabled={page + 1 >= totalPages} onClick={() => setPage(totalPages - 1)} className={styles.nav}><FaAngleDoubleRight /></button>
      </div>

      {/* 🔹 Users Modal */}
      {modalOpen && (
        <UsersModal
          onClose={() => setModalOpen(false)}
          user={selectedUser}
          onSuccess={fetchUsers}
          departmentList={departmentList}
        />
      )}

      {/* 🔹 User Assets Modal */}
      {assetsModalOpen && assetUser && (
        <UserAssetsModal
          user={assetUser}
          onClose={() => setAssetsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Users;