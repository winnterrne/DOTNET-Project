import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { DB, User } from '../types';
import { createSeed } from './seed';
import { runScheduler } from './logic';

const KEY = 'dfgym_db_v2_hcm';
const SESSION_KEY = 'dfgym_session_v1';

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      // Tự động bổ sung số đo 3 vòng và ghi chú cho dữ liệu localStorage cũ nếu chưa có
      const m1Notes = [
        'Khởi điểm: Đo InBody lần đầu, bắt đầu lộ trình giảm mỡ tăng cơ',
        'Tuần 2: Quen nhịp cardio & cắt nước ngọt có gas',
        'Tuần 4: Tăng mức tạ Squat & Deadlift thêm 10kg',
        'Tuần 6: Giảm rõ mỡ vùng bụng, cơ ngực bắt đầu dày hơn',
        'Tuần 8: Duy trì ăn giàu đạm 155g/ngày theo gợi ý AI',
        'Tuần 10: Thể lực bền bỉ, hoàn thành HIIT 45 phút không hụt hơi',
        'Tuần 11: Siết nét cơ vai & lưng xô, vòng eo giảm gần 8cm',
        'Hiện tại: Đạt mốc dưới 20% mỡ cơ thể, chuẩn bị chu kỳ Lean Bulk',
      ];
      let m1Idx = 0;
      parsed.bodyMetrics?.forEach((bm) => {
        if (bm.memberId === 'm1') {
          if (bm.chest === undefined) bm.chest = +(96 + m1Idx * 0.55).toFixed(1);
          if (bm.waist === undefined) bm.waist = +(88.5 - m1Idx * 1.25).toFixed(1);
          if (bm.hips === undefined) bm.hips = +(97.5 - m1Idx * 0.28).toFixed(1);
          if (!bm.note || bm.note === 'Lần đo đầu tiên') {
            bm.note = m1Notes[m1Idx] || 'Đo định kỳ tại phòng tập';
          }
          m1Idx++;
        } else if (bm.chest === undefined) {
          bm.chest = 86;
          bm.waist = 70;
          bm.hips = 93;
        }
      });
      return parsed;
    }
  } catch {
    /* ignore */
  }
  const db = createSeed();
  runScheduler(db);
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface Ctx {
  db: DB;
  user: User | null;
  /** Áp dụng thay đổi lên bản sao DB; ném lỗi -> hiện toast lỗi, trả về undefined */
  act: <T>(fn: (draft: DB) => T, successMsg?: string | ((r: T) => string | undefined)) => T | undefined;
  login: (u: User) => void;
  logout: () => void;
  reset: () => void;
  toast: (message: string, type?: Toast['type']) => void;
  toasts: Toast[];
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const AppCtx = createContext<Ctx>(null as unknown as Ctx);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dfgym_theme') as 'light' | 'dark') || 'light';
  });
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dfgym_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const commit = useCallback((next: DB) => {
    dbRef.current = next;
    setDb(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const act = useCallback(
    <T,>(fn: (draft: DB) => T, successMsg?: string | ((r: T) => string | undefined)) => {
      const draft = structuredClone(dbRef.current);
      try {
        const res = fn(draft);
        commit(draft);
        const msg = typeof successMsg === 'function' ? successMsg(res) : successMsg;
        if (msg) toast(msg, 'success');
        return res;
      } catch (e) {
        toast((e as Error).message, 'error');
        return undefined;
      }
    },
    [commit, toast],
  );

  // tác vụ nền mô phỏng: nhắc lịch, hết hạn waitlist, auto check-out...
  useEffect(() => {
    const tick = () => {
      const draft = structuredClone(dbRef.current);
      const before = JSON.stringify(draft);
      runScheduler(draft);
      if (JSON.stringify(draft) !== before) commit(draft);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [commit]);

  const user = useMemo(() => db.users.find((u) => u.id === userId) ?? null, [db.users, userId]);

  const value: Ctx = {
    db,
    user,
    act,
    toast,
    toasts,
    theme,
    toggleTheme,
    login: (u) => {
      localStorage.setItem(SESSION_KEY, u.id);
      setUserId(u.id);
    },
    logout: () => {
      localStorage.removeItem(SESSION_KEY);
      setUserId(null);
    },
    reset: () => {
      const fresh = createSeed();
      runScheduler(fresh);
      commit(fresh);
      toast('Đã khôi phục dữ liệu demo ban đầu', 'info');
    },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
export const useAuth = useApp;
export const AuthProvider = AppProvider;
