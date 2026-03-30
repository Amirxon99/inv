import { createSlice } from "@reduxjs/toolkit";

const getLS = (key, fallback) => localStorage.getItem(key) || fallback;

const initialState = {
  siteMode: getLS("siteMode", "normal"),     
  fontSize: getLS("fontSize", "medium"),    
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setSiteMode(state, action) {
      state.siteMode = action.payload;
      localStorage.setItem("siteMode", state.siteMode);
    },
    setFontSize(state, action) {
      state.fontSize = action.payload;
      localStorage.setItem("fontSize", state.fontSize);
    },
  },
});

export const { setSiteMode, setFontSize } = uiSlice.actions;
export default uiSlice.reducer;
