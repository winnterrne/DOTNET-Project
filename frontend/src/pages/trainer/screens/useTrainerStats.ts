import { useApp } from '../../../store/AppContext';
import * as L from '../../../store/logic';

export const useTrainerStats = () => {
  const { db, user } = useApp();
  const tid = user!.id;
  const reviews = db.reviews.filter((r) => r.trainerId === tid);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const now = Date.now();
  const pending = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'pending');
  const upcomingPT = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'confirmed' && new Date(b.endAt).getTime() > now - 3 * 3600000).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const sessions = db.sessions.filter((s) => s.trainerId === tid).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled' && new Date(s.startAt).getTime() > now);
  const toMark = sessions.filter((s) => s.status !== 'cancelled' && !s.attendanceConfirmed && new Date(s.startAt).getTime() < now);
  const ptDone = db.ptBookings.filter((b) => b.trainerId === tid && b.status === 'completed').length;
  return { reviews, avg, pending, upcomingPT, sessions, upcomingSessions, toMark, ptDone };
};
