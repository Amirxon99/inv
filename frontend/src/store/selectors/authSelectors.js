import { createSelector } from "@reduxjs/toolkit";

export const selectUserRoles = createSelector(
  (state) => state.auth.user,
  (user) => user?.roles || []
);