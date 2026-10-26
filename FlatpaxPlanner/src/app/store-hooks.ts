import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/app/store';

// typed custom hooks to get proper TypeScript type checking and autocomplete.
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
