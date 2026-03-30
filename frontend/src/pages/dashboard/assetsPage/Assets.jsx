import React, { useEffect, useState } from "react";
import axiosInstance from "../../../api/axiosInstanse";
import styles from "./assets.module.css";
import { useSelector } from "react-redux";
import QRCodeModal from "./qrCodeModal/QrCodeModal";
import AssetsModal from "./assetsModal/AssetsModal";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
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

const Assets = () => {
  const lang = useSelector((state) => state.auth.lang);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roomFilter, setRoomFilter] = useState("");
  const [campusFilter, setCampusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [roomsList, setRoomsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [campusList, setCampusList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQuery(searchValue);
      setPage(0);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // Fetch assets
  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const sortQuery = sortConfig.key
        ? `${sortConfig.key},${sortConfig.direction}`
        : "id,asc";

      const params = { page, size, sort: sortQuery };
      if (query) params.q = query;
      if (roomFilter) params.room_id = roomFilter;
      if (departmentFilter) params.department_id = departmentFilter;
      if (campusFilter) params.campus = campusFilter;
      if (categoryFilter) params.category_id = categoryFilter;

      const queryString = new URLSearchParams(params).toString();
      const { data: res } = await axiosInstance.get(
        `/assets/list?${queryString}`,
      );

      if (res.content) {
        setAssets(res.content);
        setTotalPages(res.totalPages || 0);
        setTotalElements(res.total || 0);
        setRoomsList(res.roomsList || []);
        setDepartmentsList(res.departmentsList || []);
        setCategoriesList(res.categoriesList || []);
        const uniqueCampus = [
          ...new Set(res.roomsList.map((r) => r.campus).filter(Boolean)),
        ];
        setCampusList(uniqueCampus);
      } else setError("Ma'lumot kelmadi");
    } catch (err) {
      setError(err.message || "Server xatoligi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [
    page,
    size,
    sortConfig,
    query,
    roomFilter,
    departmentFilter,
    campusFilter,
    categoryFilter,
    lang,
  ]);

  // Sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  // Delete asset
  const deleteAsset = async (id) => {
    if (!window.confirm("Assetni o‘chirmoqchimisiz?")) return;
    try {
      await axiosInstance.delete(`/assets/${id}`);
      toast.success("Asset muvaffaqiyatli o‘chirildi ✅");
      fetchAssets();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "O‘chirishda xatolik yuz berdi ❌",
      );
    }
  };

  // Pagination helpers
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

  // Checkbox handlers
  const handleCheckboxChange = (id) => {
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([]);
      setSelectAll(false);
    } else {
      setSelectedAssets(assets.map((a) => a.id));
      setSelectAll(true);
    }
  };

  // Format price
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

  const columns = [
    { label: "№", key: "id" },
    { label: "Name", key: "name" },
    { label: "Units", key: "units" },
    { label: "Inventory №", key: "inv_number" },
    { label: "Price", key: "price" },
    { label: "Status", key: "status" },
    { label: "Type", key: "type" },
    { label: "Room", key: "room_name" },
    { label: "Department", key: "department_name" },
    { label: "Category", key: "category_name" },
    { label: "Date", key: "created_at" },
  ];

  return (
    <div className={styles.wrapper}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.paginationInfo}>
          Ko‘rsatilmoqda <span>{startItem}</span>-<span>{endItem}</span> (Jami:{" "}
          <span>{totalElements}</span>)
        </div>
        <div className={styles.pageCount}>
          <button
            className={styles.createBtn}
            onClick={() => {
              setSelectedAsset(null);
              setModalOpen(true);
            }}
          >
            Asset qo‘shish
          </button>
          <button
            className={styles.qr}
            onClick={() => setQrModalOpen(true)}
            disabled={selectedAssets.length === 0}
            style={{ marginLeft: 8 }}
          >
            QR Code yaratish
          </button>
          Sahifa <span>{page + 1}</span>/<span>{totalPages}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <TextField
          placeholder="Asset nomi yoki inventory №..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          size="small"
          style={{ width: 250, marginRight: 16 }}
        />
        <Autocomplete
          options={[null, ...campusList]}
          getOptionLabel={(option) => option || "Barcha kampuslar"}
          value={campusFilter || null}
          onChange={(e, value) => {
            setCampusFilter(value || "");
            setPage(0);
            setRoomFilter("");
          }}
          renderInput={(params) => (
            <TextField {...params} label="Campus" size="small" />
          )}
          style={{ width: 200, marginRight: 16 }}
        />
        <Autocomplete
          options={[
            { id: "", name: "Barcha bo‘limlar" },
            { id: "null", name: "⚠️ Bo'limsizlar" },
            ...departmentsList,
          ]}
          getOptionLabel={(option) => option.name || ""}
          value={
            departmentFilter === "null"
              ? { id: "null", name: "⚠️ Bo'limsizlar" }
              : departmentsList.find(
                  (d) => d.id === Number(departmentFilter),
                ) || { id: "", name: "Barcha bo‘limlar" }
          }
          onChange={(e, value) => {
            setDepartmentFilter(value?.id || "");
            setRoomFilter("");
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Department" size="small" />
          )}
          style={{ width: 200, marginRight: 16 }}
        />
        <Autocomplete
          options={[{ id: "", name: "Barcha xonalar" }, ...roomsList]}
          getOptionLabel={(option) => option.name || ""}
          value={
            roomsList.find((r) => r.id === Number(roomFilter)) || {
              id: "",
              name: "Barcha xonalar",
            }
          }
          onChange={(e, value) => {
            setRoomFilter(value?.id || "");
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Room" size="small" />
          )}
          style={{ width: 250, marginRight: 16 }}
        />
        <Autocomplete
          options={[
            { id: "", name: "Barcha kategoriyalar" },
            ...categoriesList,
          ]}
          getOptionLabel={(option) => option.name || ""}
          value={
            categoriesList.find((c) => c.id === Number(categoryFilter)) || {
              id: "",
              name: "Barcha kategoriyalar",
            }
          }
          onChange={(e, value) => {
            setCategoryFilter(value?.id || "");
            setPage(0);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Category" size="small" />
          )}
          style={{ width: 250, marginRight: 16 }}
        />
        <TextField
          select
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            setPage(0);
          }}
          SelectProps={{ native: true }}
          size="small"
          style={{ width: 100 }}
        >
          {[5, 10, 20, 50, totalElements].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </TextField>
      </div>

      {/* Table */}
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
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
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
            {assets.map((a, i) => (
              <tr
                key={a.id}
                style={{
                  backgroundColor: a.room_name === "Noma'lum" ? "#ee8989" : "",
                }}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(a.id)}
                    onChange={() => handleCheckboxChange(a.id)}
                  />
                </td>
                <td>{startItem + i}</td>
                <td>{a.name}</td>
                <td>
                  {a.units?.toString().trim() === "piece"
                    ? "Штука"
                    : "Комплект"}
                </td>
                <td>{a.inv_number}</td>
                <td>
                  {formatPrice(a.price).split(".")[0]}
                  <span className={styles.decimal}>
                    .{formatPrice(a.price).split(".")[1]}
                  </span>
                </td>
                <td>{a.status}</td>
                <td>{a.type}</td>
                <td>{a.room_name || "Xona biriktirilmagan"}</td>
                <td>{a.department_name || "Noma'lum"}</td>
                <td>{a.category_name || "Noma'lum"}</td>
                <td>
                  {a.created_at
                    ? new Date(a.created_at).toLocaleString("en-GB", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false, // ✅ 24 soatlik format
                      })
                    : "-"}
                </td>
                <td className={styles.actions}>
                  <button
                    className={styles.edit}
                    onClick={() => {
                      setSelectedAsset(a);
                      setModalOpen(true);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className={styles.delete}
                    onClick={() => deleteAsset(a.id)}
                  >
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
            className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}
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

      {/* Assets Modal */}
      {modalOpen && (
        <AssetsModal
          onClose={() => setModalOpen(false)}
          asset={selectedAsset}
          onSuccess={fetchAssets}
          roomsList={roomsList}
          departmentsList={departmentsList}
          categoriesList={categoriesList}
        />
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <QRCodeModal
          onClose={() => setQrModalOpen(false)}
          assets={assets.filter((a) => selectedAssets.includes(a.id))}
        />
      )}
    </div>
  );
};

export default Assets;
