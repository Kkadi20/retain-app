import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface FiltersState {
  search: string;
  category: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  sortBy: "date" | "amount";
  sortOrder: "asc" | "desc";
}

const initialState: FiltersState = {
  search: "",
  category: "",
  paymentMethod: "",
  startDate: "",
  endDate: "",
  sortBy: "date",
  sortOrder: "desc",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
    setCategory: (state, action: PayloadAction<string>) => {
      state.category = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
    },
    setSort: (state, action: PayloadAction<{ sortBy: "date" | "amount"; sortOrder: "asc" | "desc" }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    resetFilters: () => initialState,
  },
});

export const { setSearch, setCategory, setPaymentMethod, setDateRange, setSort, resetFilters } = filtersSlice.actions;
export default filtersSlice.reducer;