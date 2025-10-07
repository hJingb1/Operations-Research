// frontend/src/components/Leaderboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Leaderboard() {
  const [track, setTrack] = useState('cost'); // 'cost' or 'time'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/leaderboard?track=${track}`);
        setData(response.data);
      } catch (error) {
        console.error("获取排行榜数据失败:", error);
        setData([]); // 出错时清空数据
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [track]); // 每当 track 变化时，重新获取数据

  return (
    <div>
      <h2>排行榜</h2>
      <div>
        <button onClick={() => setTrack('cost')} disabled={track === 'cost'}>成本榜</button>
        <button onClick={() => setTrack('time')} disabled={track === 'time'} style={{ marginLeft: '10px' }}>工期榜</button>
      </div>
      {loading ? <p>正在加载排行榜...</p> : (
        <table className="task-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>姓名</th>
              <th>分数 ({track === 'cost' ? '成本' : '工期'})</th>
              <th>提交时间</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.name}</td>
                <td>{track === 'cost' ? `¥${Math.round(row.score).toLocaleString()}` : `${row.score} 天`}</td>
                <td>{new Date(row.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Leaderboard;