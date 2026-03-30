
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstanse";

const loadUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const saveUser = (user) => {
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

const clearStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("lang");
};


export const bootstrapAuth = createAsyncThunk(
  "auth/bootstrapAuth",
  async (_, thunkAPI) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return { user: null };

      const { data } = await axiosInstance.get("/auth/user/me");
      return { user: saveUser(data) };
    } catch (error) {
      return thunkAPI.rejectWithValue("Bootstrap xato");
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: loadUser(),
    loading: false,
    error: null,
    lang: localStorage.getItem("lang") || "uz",
  },
  reducers: {
    loginSuccess(state, action) {
      const { accessToken, refreshToken } = action.payload;
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      state.error = null;
    },

    logoutLocal(state) {
      clearStorage();
      state.user = null;
      state.loading = false;
      state.error = null;
    },

    setLang(state, action) {
      state.lang = action.payload;
      localStorage.setItem("lang", action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });
  },
});

export const { loginSuccess, logoutLocal, setLang } = authSlice.actions;
export default authSlice.reducer;