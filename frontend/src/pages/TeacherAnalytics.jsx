import React, { useEffect, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import API from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

export default function TeacherAnalytics(){
  const [classrooms, setClassrooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      try{
        const res = await API.get('/teacher/classrooms');
        if (!mounted) return;
        setClassrooms(res.data.classrooms || []);
        if (res.data.classrooms && res.data.classrooms.length) {
          const id = res.data.classrooms[0]._id || res.data.classrooms[0].id;
          setSelected(id);
        }
      }catch(e){ console.warn(e); }
    })();
    return ()=> mounted = false;
  },[]);

  useEffect(()=>{
    if (!selected) return;
    let mounted = true;
    (async ()=>{
      try{
        const res = await API.get(`/teacher/classrooms/${selected}/analytics`);
        if (!mounted) return;
        setData(res.data);
      }catch(e){ console.warn('analytics fetch', e); }
    })();
    return ()=> mounted = false;
  },[selected]);
  // Adapt to backend: { assignmentSeries, students (with avgGrade, completion), pie: {submitted, pending} }
  const barData = data ? {
    labels: data.students.map(s => s.name),
    datasets: [{ label: 'Completion %', data: data.students.map(s => s.completion || 0), backgroundColor: 'rgba(0,123,255,0.85)' }]
  } : null;

  const lineData = data ? {
    labels: data.assignmentSeries.map(a => a.title),
    datasets: [{ label: 'Avg Grade per Assignment', data: data.assignmentSeries.map(a => a.avgGrade || 0), borderColor: '#007bff', backgroundColor: 'rgba(0,123,255,0.15)', tension:0.2 }]
  } : null;

  const pieData = data ? {
    labels: ['Submitted','Pending'],
    datasets: [{ data: [data.pie.submitted || 0, data.pie.pending || 0], backgroundColor: ['#007bff','#e9ecef'] }]
  } : null;

  return (
    <div className="page container">
      <h2>Student Progress Analytics</h2>
      <p className="muted">Visualize class performance and spot students who need help.</p>

      <div className="card p-3 mb-3">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4>Overview</h4>
          <div className="small-muted">Filters • Subject / Date / Performance</div>
        </div>

        <div style={{display:'flex',gap:12,marginTop:12,alignItems:'center'}}>
          <label style={{fontWeight:600}}>Class:</label>
          <select value={selected||''} onChange={e=>setSelected(e.target.value)}>
            {(classrooms||[]).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:12}}>
          <div className="card p-3">
            <strong>Avg Grade per Student</strong>
            {barData ? <Bar data={barData} /> : <div className="muted">Loading chart...</div>}
          </div>
          <div className="card p-3">
            <strong>Class Trend</strong>
            {lineData ? <Line data={lineData} /> : <div className="muted">Loading chart...</div>}
          </div>
          <div className="card p-3">
            <strong>Submission Status</strong>
            {pieData ? <Pie data={pieData} /> : <div className="muted">Loading chart...</div>}
          </div>
          <div className="card p-3">
            <h5>AI Suggestion</h5>
            <div className="muted">{data ? `${data.students.filter(s=>!s.avgGrade || s.avgGrade < 50).length} students are underperforming. Suggest a group revision.` : 'Loading suggestion...'}</div>
            <div style={{marginTop:12}}>
              <button className="btn btn-primary">Create Revision Announcement</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
