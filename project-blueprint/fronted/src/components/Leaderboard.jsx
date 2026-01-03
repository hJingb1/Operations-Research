// frontend/src/components/Leaderboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Leaderboard.css';

function Leaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/leaderboard?track=weighted`);
        setData(response.data);
      } catch (error) {
        console.error("获取排行榜数据失败:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-badge gold">🥇</span>;
    if (index === 1) return <span className="rank-badge silver">🥈</span>;
    if (index === 2) return <span className="rank-badge bronze">🥉</span>;
    return <span className="rank-number">{index + 1}</span>;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">排行榜 - 全生命周期总成本</h2>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">正在加载排行榜...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className='col-rank'>排名</th>
                <th className='col-name'>姓名</th>
                <th className="col-data" style={{textAlign: 'center'}}>全生命周期总成本</th>
                <th className="col-data" style={{textAlign: 'center'}}>工期(天)</th>
                <th className="col-data" style={{textAlign: 'center'}}>直接成本(元)</th>
                <th className='col-time'>提交时间</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>暂无提交数据</p>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className={getRankClass(index)}>
                    <td className="rank-cell">
                      {getRankBadge(index)}
                    </td>
                    <td className="name-cell">{row.name}</td>
                    <td className="score-cell">
                      <span className="lifecycle-cost">
                        ¥{Math.round(parseFloat(row.lifecycle_cost)).toLocaleString()}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>{row.project_duration} 天</td>
                    <td style={{textAlign: 'center'}}>¥{Math.round(row.direct_cost).toLocaleString()}</td>
                    <td className="time-cell">{new Date(row.submitted_at).toLocaleString('zh-CN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
