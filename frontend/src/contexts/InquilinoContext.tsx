import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { InquilinoState, InquilinoAction } from '../types/inquilino';

const initialState: InquilinoState = {
  inquilinos: [],
  selectedInquilino: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  stats: undefined,
};

function inquilinoReducer(state: InquilinoState, action: InquilinoAction): InquilinoState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_INQUILINOS':
      return {
        ...state,
        inquilinos: action.payload.inquilinos,
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
      };

    case 'ADD_INQUILINO':
      return {
        ...state,
        inquilinos: [action.payload, ...state.inquilinos],
        totalCount: state.totalCount + 1,
      };

    case 'UPDATE_INQUILINO':
      return {
        ...state,
        inquilinos: state.inquilinos.map(inquilino =>
          inquilino.id === action.payload.id ? action.payload : inquilino
        ),
        selectedInquilino: state.selectedInquilino?.id === action.payload.id
          ? action.payload
          : state.selectedInquilino,
      };

    case 'DELETE_INQUILINO':
      return {
        ...state,
        inquilinos: state.inquilinos.filter(inquilino => inquilino.id !== action.payload),
        totalCount: state.totalCount - 1,
        selectedInquilino: state.selectedInquilino?.id === action.payload
          ? null
          : state.selectedInquilino,
      };

    case 'SET_SELECTED':
      return { ...state, selectedInquilino: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_STATS':
      return { ...state, stats: action.payload };

    default:
      return state;
  }
}

const InquilinoContext = createContext<{
  state: InquilinoState;
  dispatch: React.Dispatch<InquilinoAction>;
} | null>(null);

export function InquilinoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inquilinoReducer, initialState);

  return (
    <InquilinoContext.Provider value={{ state, dispatch }}>
      {children}
    </InquilinoContext.Provider>
  );
}

export function useInquilinoContext() {
  const context = useContext(InquilinoContext);
  if (!context) {
    throw new Error('useInquilinoContext must be used within InquilinoProvider');
  }
  return context;
}