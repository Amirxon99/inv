import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./assetCategories.module.css";
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
import AssetCategoriesModal from "./assetCategoriesModal/AssetCategoriesModal";
import { toast } from "react-toastify";

const AssetCategories = () => {
  const [categories, setCategories] = useState([]);
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
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 🔹 SEARCH DEBOUNCE
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchValue]);

  // 🔹 FETCH
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const sortQuery = sortConfig.key
        ? `${sortConfig.key},${sortConfig.direction}`
        : "id,asc";

      const params = { page, size, sort: sortQuery };

      if (query) params.q = query;

      const queryString = new URLSearchParams(params).toString();

      const { data: res } = await axiosInstance.get(
        `/asset-categories/list?${queryString}`
      );

      if (res.content) {
        setCategories(res.content || []);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.total || 0);
      } else {
        setError("Ma'lumot kelmadi");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Server xatoligi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, size, sortConfig, query, lang]);

  // 🔹 SORT
  const handleSort = (key) => {
    let direction = "asc";

    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
  };

  // 🔹 DELETE
  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm("Kategoriyani o‘chirmoqchimisiz?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/asset-categories/${id}`);
      toast.success("Kategoriya muvaffaqiyatli o‘chirildi ✅");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "O‘chirishda xatolik ❌");
    }
  };

  // 🔹 PAGINATION
  const getVisiblePages = () => {
    const delta = 2;

    let start = Math.max(0, page - delta);
    let end = Math.min(totalPages - 1, page + delta);

    if (page <= delta) end = Math.min(4, totalPages - 1);
    if (page + delta >= totalPages - 1)
      start = Math.max(0, totalPages - 5);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  const columns = [
    { label: "№", key: "id" },
    { label: "Kategoriya nomi", key: "name" },
    { label: "Tavsif", key: "description" },
  ];

  return (
    <div className={styles.wrapper}>

      {/* TOP */}
      <div className={styles.topBar}>
        <div className={styles.paginationInfo}>
          Ko‘rsatilmoqda <span>{startItem}</span>-<span>{endItem}</span> (Jami:{" "}
          <span>{totalElements}</span>)
        </div>

        <div className={styles.pageCount}>
          <button
            className={styles.createBtn}
            onClick={() => {
              setSelectedCategory(null);
              setModalOpen(true);
            }}
          >
            Kategoriya qo‘shish
          </button>

          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Kategoriya nomi..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={styles.input}
        />

        <select
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
          className={styles.select}
        >
          {[5, 10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s}/page
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
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

                  {sortConfig.key === col.key ? (
                    sortConfig.direction === "asc" ? (
                      <FaSortUp />
                    ) : (
                      <FaSortDown />
                    )
                  ) : (
                    <FaSort />
                  )}
                </th>
              ))}

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat, i) => (
              <tr key={cat.id}>
                <td>{startItem + i}</td>
                <td>{cat.name}</td>
                <td>{cat.description}</td>

                <td className={styles.actions}>
                  <button
                    className={styles.edit}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setModalOpen(true);
                    }}
                  >
                    <FaEdit />
                  </button>

                  <button
                    className={styles.delete}
                    onClick={() => deleteCategory(cat.id)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      <div className={styles.pagination}>
        <button
          disabled={page === 0}
          onClick={() => setPage(0)}
          className={styles.nav}
        >
          <FaAngleDoubleLeft />
        </button>

        <button
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
          className={styles.nav}
        >
          <FaAngleLeft />
        </button>

        {getVisiblePages().map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`${styles.pageBtn} ${
              page === p ? styles.active : ""
            }`}
          >
            {p + 1}
          </button>
        ))}

        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(page + 1)}
          className={styles.nav}
        >
          <FaAngleRight />
        </button>

        <button
          disabled={page + 1 >= totalPages}
          onClick={() => setPage(totalPages - 1)}
          className={styles.nav}
        >
          <FaAngleDoubleRight />
        </button>
      </div>

      {modalOpen && (
        <AssetCategoriesModal
          onClose={() => setModalOpen(false)}
          category={selectedCategory}
          onSuccess={fetchCategories}
        />
      )}
    </div>
  );
};

export default AssetCategories;