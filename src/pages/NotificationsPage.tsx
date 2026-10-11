import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { PageHead, Tabs, Empty } from '../components/ui';
import { ntfStyle } from '../components/Layout';
import { timeAgo, fmtDateTime } from '../utils';
import type { Notification } from '../types';

export function NotificationsPage() {
  const { db, user, act } = useApp();
  const nav = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = db.notifications
    .filter((n) => n.userId === user?.id)
    .filter((n) => (filter === 'unread' ? !n.read : true));

  const unreadCount = db.notifications.filter((n) => n.userId === user?.id && !n.read).length;

  const markAllRead = () => {
    act((d) => {
      d.notifications.forEach((n) => {
        if (n.userId === user?.id) n.read = true;
      });
    }, 'Đã đánh dấu tất cả là đã đọc');
  };

  const clearAll = () => {
    act((d) => {
      d.notifications = d.notifications.filter((n) => n.userId !== user?.id);
    }, 'Đã xóa tất cả thông báo');
  };

  const handleClick = (n: Notification) => {
    act((d) => {
      const item = d.notifications.find((x) => x.id === n.id);
      if (item) item.read = true;
    });
    if (n.link) nav(n.link);
  };

  return (
    <>
      <PageHead
        title="Thông báo"
        desc="Nhắc lịch tập, biến động gói tập, kết quả duyệt freeze và các cập nhật quan trọng."
        actions={
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn sm" onClick={markAllRead} disabled={unreadCount === 0} id="btn-mark-all-read">
              <CheckCheck size={16} /> Đánh dấu đã đọc tất cả
            </button>
            <button className="btn sm danger" onClick={clearAll} disabled={db.notifications.filter((n) => n.userId === user?.id).length === 0} id="btn-clear-all-ntf">
              <Trash2 size={16} /> Xóa tất cả
            </button>
          </div>
        }
      />

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'all', label: 'Tất cả', count: db.notifications.filter((n) => n.userId === user?.id).length },
          { id: 'unread', label: 'Chưa đọc', count: unreadCount },
        ]}
      />

      {notifications.length === 0 ? (
        <div className="card">
          <Empty text="Không có thông báo nào" icon={<Bell size={40} />} />
        </div>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          {notifications.map((n) => {
            const style = ntfStyle[n.type];
            return (
              <div
                key={n.id}
                className={`list-item ${!n.read ? 'card' : ''}`}
                style={{
                  cursor: n.link ? 'pointer' : 'default',
                  borderLeft: `4px solid ${style.c}`,
                  background: !n.read ? 'rgba(124, 92, 255, 0.08)' : undefined,
                }}
                onClick={() => handleClick(n)}
              >
                <div
                  className="ntf-icon"
                  style={{
                    background: `${style.c}22`,
                    color: style.c,
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {style.i}
                </div>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <b style={{ fontSize: 14 }}>{n.title}</b>
                    {!n.read && <span className="badge b-purple plain">Mới</span>}
                  </div>
                  <div className="muted mt8" style={{ marginTop: 4 }}>{n.message}</div>
                  <div className="small dim mt8" style={{ marginTop: 6 }}>
                    {fmtDateTime(n.createdAt)} · {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
