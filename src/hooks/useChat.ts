import { useAppDispatch, useAppSelector } from '../store/hooks';

export function useChat() {
  const state = useAppSelector((root) => root.chat);
  const dispatch = useAppDispatch();

  return { state, dispatch };
}