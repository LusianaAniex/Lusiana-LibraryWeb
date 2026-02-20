import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  searchQuery: string;
  selectedCategoryId: number | null;
  minRating: number | null;
}

const initialState: UiState = {
  searchQuery: '',
  selectedCategoryId: null,
  minRating: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setCategoryFilter(state, action: PayloadAction<number | null>) {
      state.selectedCategoryId = action.payload;
    },
    setRatingFilter(state, action: PayloadAction<number | null>) {
      state.minRating = action.payload;
    },
    resetFilters(state) {
      state.searchQuery = '';
      state.selectedCategoryId = null;
      state.minRating = null;
    },
  },
});

export const {
  setSearchQuery,
  setCategoryFilter,
  setRatingFilter,
  resetFilters,
} = uiSlice.actions;
export default uiSlice.reducer;
