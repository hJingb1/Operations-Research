// fronted/src/store/gameSlice.js
import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    currentPhase: 1, // 1=阶段1, 2=阶段2
    phase1Passed: false,
    phase1Score: 0
  },
  reducers: {
    setCurrentPhase: (state, action) => {
      state.currentPhase = action.payload;
    },
    setPhase1Result: (state, action) => {
      state.phase1Passed = true;
      state.phase1Score = action.payload.score;
      state.currentPhase = 2;
    },
    initializeFromAuth: (state, action) => {
      // 从JWT token中读取currentPhase
      state.currentPhase = action.payload.currentPhase || 1;
      state.phase1Passed = action.payload.currentPhase === 2;
    }
  }
});

export const { setCurrentPhase, setPhase1Result, initializeFromAuth } = gameSlice.actions;
export default gameSlice.reducer;
