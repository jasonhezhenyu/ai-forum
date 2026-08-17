import db from './db';

export async function createNotification(
  userId: number,
  type: 'comment' | 'like',
  message: string,
  postId: number,
  fromUserId: number
) {
  // 不给自己发通知
  if (userId === fromUserId) return;

  await db.run(`
    INSERT INTO notifications (user_id, type, message, post_id, from_user_id)
    VALUES (?, ?, ?, ?, ?)
  `, userId, type, message, postId, fromUserId);
}

export async function getUnreadCount(userId: number): Promise<number> {
  const row = await db.get(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    userId
  ) as { count: number };
  return row.count;
}

export async function getNotifications(userId: number, limit = 20) {
  return db.all(`
    SELECT
      n.id, n.type, n.message, n.post_id, n.is_read, n.created_at,
      u.username AS from_username, u.nickname AS from_nickname, u.avatar AS from_avatar
    FROM notifications n
    LEFT JOIN users u ON n.from_user_id = u.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT ?
  `, userId, limit);
}

export async function markAsRead(userId: number, notificationId?: number) {
  if (notificationId) {
    await db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', notificationId, userId);
  } else {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', userId);
  }
}
