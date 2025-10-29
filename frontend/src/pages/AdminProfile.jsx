import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function AdminProfile(){
  const { user } = useContext(AuthContext);
  if (!user) return <div>Please login</div>;
  return (
    <div className="page container">
      <h2>Profile</h2>
      <div className="card p-3" style={{maxWidth:840}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:72,height:72,background:'#eef4ff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>👤</div>
          <div>
            <div style={{fontSize:18,fontWeight:600}}>{user.name}</div>
            <div style={{color:'#666'}}>{user.email}</div>
            <div style={{marginTop:6,fontSize:13,color:'#666'}}>Role: {user.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
