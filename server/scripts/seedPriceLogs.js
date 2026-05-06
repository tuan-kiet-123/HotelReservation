require('dotenv').config({ path: '../.env' });
const { pool } = require('../src/config/mysql');

(async () => {
  try {
    // Get some room IDs first
    const [rooms] = await pool.query('SELECT RoomId, RoomType, CurrentPrice FROM Room LIMIT 3');
    
    const logs = [];
    const dates = [
      '2026-04-27 10:15:00',
      '2026-04-26 14:30:00',
      '2026-04-25 09:00:00',
      '2026-04-24 16:20:00',
      '2026-04-23 11:45:00'
    ];

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      for (let j = 0; j < Math.min(2, dates.length); j++) {
        const oldPrice = Math.floor(room.CurrentPrice * 0.8);
        const newPrice = Math.floor(room.CurrentPrice * (0.9 + Math.random() * 0.2));
        
        logs.push({
          logId: `LOG-${String(i * 10 + j + 1).padStart(3, '0')}`,
          roomId: room.RoomId,
          oldPrice,
          newPrice,
          changedAt: dates[j]
        });
      }
    }

    // Insert logs
    for (const log of logs) {
      await pool.query(
        'INSERT INTO PriceChangeLog (LogId, RoomId, OldPrice, NewPrice, ChangedAt) VALUES (?, ?, ?, ?, ?)',
        [log.logId, log.roomId, log.oldPrice, log.newPrice, log.changedAt]
      );
    }
    
    console.log('Inserted', logs.length, 'price change logs');
    console.log('Logs:', JSON.stringify(logs, null, 2));
    
    // Verify
    const [result] = await pool.query('SELECT COUNT(*) as count FROM PriceChangeLog');
    console.log('Total logs in DB:', result[0].count);
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    await pool.end();
  }
})();
