import { createContext, useContext, useState, type ReactNode } from 'react';
import type { GitHubRepo } from '../types';

export type PopupSide = 'left' | 'right';

interface RepoPopupCtx {
  leftRepo: GitHubRepo | null;
  rightRepo: GitHubRepo | null;
  openPopup: (repo: GitHubRepo, side: PopupSide) => void;
  closePopup: (side: PopupSide) => void;
  hasPopup: (side: PopupSide) => boolean;
}

const Ctx = createContext<RepoPopupCtx>({ leftRepo: null, rightRepo: null, openPopup: () => {}, closePopup: () => {}, hasPopup: () => false });

export function RepoPopupProvider({ children }: { children: ReactNode }) {
  const [leftRepo, setLeft] = useState<GitHubRepo | null>(null);
  const [rightRepo, setRight] = useState<GitHubRepo | null>(null);

  const openPopup = (repo: GitHubRepo, side: PopupSide) => {
    if (side === 'left') setLeft(repo);
    else setRight(repo);
  };
  const closePopup = (side: PopupSide) => {
    if (side === 'left') setLeft(null);
    else setRight(null);
  };
  const hasPopup = (side: PopupSide) => side === 'left' ? !!leftRepo : !!rightRepo;

  return (
    <Ctx.Provider value={{ leftRepo, rightRepo, openPopup, closePopup, hasPopup }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRepoPopup() { return useContext(Ctx); }
