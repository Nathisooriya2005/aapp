import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/bookings';

// API Service
const api = {
  getAllBookings: async () => {
    const response = await fetch(API_BASE_URL);
    return response.json();
  },
  updateBookingStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },
  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await fetch(`${API_BASE_URL}/${id}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    });
    return response.json();
  },
  deleteBooking: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};

// Login Component
function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.username === 'sports pitch' && credentials.password === 'sportspitch@dreamturf') {
      localStorage.setItem('adminAuthenticated', 'true');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use sports pitch / sportspitch@dreamturf');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      
      <div className="admin-login-form" style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '450px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Sports Booking Admin
          </h1>
          <p style={{ color: '#666', marginTop: '10px', fontSize: '14px' }}>Welcome back! Please login to continue</p>
        </div>
        
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            borderLeft: '4px solid #c33'
          }}>{error}</div>
        )}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600', fontSize: '14px' }}>Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="admin-input"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              placeholder="Enter username"
              required
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: '600', fontSize: '14px' }}>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="admin-input"
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              placeholder="Enter password"
              required
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Login
          </button>
        </form>
        
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalPaymentsReceived: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Auto-update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) {
        const bookings = response.bookings;
        setStats({
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === 'Pending').length,
          approvedBookings: bookings.filter(b => b.status === 'Approved').length,
          totalPaymentsReceived: bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.amount || 500), 0)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadToGoogleSheets = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) {
        const bookings = response.bookings;
        
        // Create CSV content
        const headers = ['Customer Name', 'Sport', 'Date', 'Time', 'Status', 'Payment Status', 'Amount'];
        const rows = bookings.map(b => [
          b.name,
          b.sport,
          b.date,
          b.time,
          b.status,
          b.paymentStatus,
          b.amount || 500
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dashboard_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/login');
  };

  if (loading) return <div className="admin-container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="admin-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header onLogout={handleLogout} />
      <Nav navigate={navigate} currentPage="dashboard" />
      <main className="admin-container" style={{ padding: '40px' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Dashboard Overview</h2>
          <button
            onClick={downloadToGoogleSheets}
            className="admin-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
            }}
          >
            📥 Download to Google Sheets
          </button>
        </div>
        <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <StatCard title="Total Bookings" value={stats.totalBookings} color="#007bff" />
          <StatCard title="Pending Bookings" value={stats.pendingBookings} color="#ffc107" />
          <StatCard title="Approved Bookings" value={stats.approvedBookings} color="#28a745" />
          <StatCard title="Total Payments Received" value={`₹${stats.totalPaymentsReceived}`} color="#17a2b8" />
        </div>
      </main>
    </div>
  );
}

// Booking Management Component
function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000); // Auto-update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) setBookings(response.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await api.updateBookingStatus(id, 'Approved');
      if (response.success) {
        fetchBookings();
        // Open WhatsApp if URL is returned
        if (response.whatsappUrl) {
          window.open(response.whatsappUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error approving booking');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await api.updateBookingStatus(id, 'Rejected');
      if (response.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error rejecting booking');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.deleteBooking(id);
      if (response.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error deleting booking');
    }
  };

  const downloadBookingsToGoogleSheets = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) {
        const bookings = response.bookings;
        
        // Create CSV content
        const headers = ['Customer Name', 'Sport', 'Date', 'Time', 'Status', 'Payment Status', 'Amount'];
        const rows = bookings.map(b => [
          b.name,
          b.sport,
          b.date,
          b.time,
          b.status,
          b.paymentStatus,
          b.amount || 500
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading bookings:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/login');
  };

  if (loading) return <div className="admin-container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="admin-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header onLogout={handleLogout} />
      <Nav navigate={navigate} currentPage="bookings" />
      <main className="admin-container" style={{ padding: '40px' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Booking Management</h2>
          <button
            onClick={downloadBookingsToGoogleSheets}
            className="admin-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
            }}
          >
            📥 Download to Google Sheets
          </button>
        </div>
        {bookings.length === 0 ? (
          <div className="admin-card" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            No bookings found
          </div>
        ) : (
          <div className="admin-table-container" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Customer Name</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Sport</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Time</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Payment</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px' }}>{booking.name}</td>
                    <td style={{ padding: '15px' }}>{booking.sport}</td>
                    <td style={{ padding: '15px' }}>{booking.date}</td>
                    <td style={{ padding: '15px' }}>{booking.time}</td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        backgroundColor: booking.status === 'Approved' ? '#28a745' : booking.status === 'Rejected' ? '#dc3545' : '#ffc107',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>{booking.status}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        backgroundColor: booking.paymentStatus === 'Paid' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>{booking.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {booking.status === 'Pending' && (
                          <>
                            <button onClick={() => handleApprove(booking._id)} style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>Approve</button>
                            <button onClick={() => handleReject(booking._id)} style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>Reject</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(booking._id)} style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// Payment Management Component
function PaymentManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) setBookings(response.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const response = await api.updatePaymentStatus(id, 'Paid');
      if (response.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating payment status');
    }
  };

  const handleMarkUnpaid = async (id) => {
    try {
      const response = await api.updatePaymentStatus(id, 'Unpaid');
      if (response.success) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating payment status');
    }
  };

  const handleUpdateAmount = async (id, amount) => {
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${id}/amount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      const result = await response.json();
      if (result.success) {
        fetchBookings();
      }
    } catch (error) {
      alert('Error updating amount');
    }
  };

  const downloadPaymentsToGoogleSheets = async () => {
    try {
      const response = await api.getAllBookings();
      if (response.success) {
        const bookings = response.bookings;
        
        // Create CSV content
        const headers = ['Customer Name', 'Sport', 'Amount', 'Payment Status'];
        const rows = bookings.map(b => [
          b.name,
          b.sport,
          b.amount || 500,
          b.paymentStatus
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'payments_data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading payments:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    navigate('/login');
  };

  if (loading) return <div className="admin-container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="admin-container" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header onLogout={handleLogout} />
      <Nav navigate={navigate} currentPage="payments" />
      <main className="admin-container" style={{ padding: '40px' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Payment Management</h2>
          <button
            onClick={downloadPaymentsToGoogleSheets}
            className="admin-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
            }}
          >
            📥 Download to Google Sheets
          </button>
        </div>
        {bookings.length === 0 ? (
          <div className="admin-card" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
            No bookings found
          </div>
        ) : (
          <div className="admin-table-container" style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Customer Name</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Sport</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Payment Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '15px' }}>{booking.name}</td>
                    <td style={{ padding: '15px' }}>{booking.sport}</td>
                    <td style={{ padding: '15px' }}>
                      <input
                        type="number"
                        defaultValue={booking.amount || 500}
                        onBlur={(e) => handleUpdateAmount(booking._id, e.target.value)}
                        style={{
                          width: '80px',
                          padding: '6px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{
                        backgroundColor: booking.paymentStatus === 'Paid' ? '#28a745' : '#dc3545',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>{booking.paymentStatus}</span>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {booking.paymentStatus === 'Unpaid' && (
                          <button onClick={() => handleMarkPaid(booking._id)} style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>Mark as Paid</button>
                        )}
                        {booking.paymentStatus === 'Paid' && (
                          <button onClick={() => handleMarkUnpaid(booking._id)} style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>Mark as Unpaid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper Components
function Header({ onLogout }) {
  return (
    <header style={{
      backgroundColor: '#007bff',
      color: 'white',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{ margin: 0, fontSize: '24px' }}>Sports Booking Admin</h1>
      <button
        onClick={onLogout}
        style={{
          backgroundColor: 'white',
          color: '#007bff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Logout
      </button>
    </header>
  );
}

function Nav({ navigate, currentPage }) {
  const getButtonStyle = (page) => {
    const isActive = currentPage === page;
    let backgroundColor, gradient, icon;
    
    switch(page) {
      case 'dashboard':
        backgroundColor = isActive ? '#28a745' : '#f8f9fa';
        gradient = isActive ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)' : 'none';
        icon = '📊';
        break;
      case 'bookings':
        backgroundColor = isActive ? '#007bff' : '#f8f9fa';
        gradient = isActive ? 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)' : 'none';
        icon = '📅';
        break;
      case 'payments':
        backgroundColor = isActive ? '#ffc107' : '#f8f9fa';
        gradient = isActive ? 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)' : 'none';
        icon = '💰';
        break;
      default:
        backgroundColor = isActive ? '#007bff' : '#f8f9fa';
        gradient = 'none';
        icon = '📋';
    }
    
    return {
      backgroundColor,
      background: gradient,
      color: isActive ? 'white' : '#495057',
      border: isActive ? 'none' : '2px solid #e9ecef',
      padding: '12px 24px',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '15px',
      transition: 'all 0.3s ease',
      boxShadow: isActive ? '0 4px 15px rgba(0, 0, 0, 0.2)' : 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    };
  };

  return (
    <nav className="admin-nav" style={{ 
      backgroundColor: 'white', 
      padding: '25px 40px', 
      borderBottom: '2px solid #e9ecef',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="admin-nav-button"
          style={getButtonStyle('dashboard')}
          onMouseEnter={(e) => {
            if (currentPage !== 'dashboard') {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'dashboard') {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          <span style={{ fontSize: '18px' }}>📊</span>
          Dashboard
        </button>
        <button
          onClick={() => navigate('/bookings')}
          className="admin-nav-button"
          style={getButtonStyle('bookings')}
          onMouseEnter={(e) => {
            if (currentPage !== 'bookings') {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'bookings') {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          <span style={{ fontSize: '18px' }}>📅</span>
          Bookings
        </button>
        <button
          onClick={() => navigate('/payments')}
          className="admin-nav-button"
          style={getButtonStyle('payments')}
          onMouseEnter={(e) => {
            if (currentPage !== 'payments') {
              e.target.style.backgroundColor = '#e9ecef';
              e.target.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 'payments') {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.transform = 'translateY(0)';
            }
          }}
        >
          <span style={{ fontSize: '18px' }}>💰</span>
          Payments
        </button>
      </div>
    </nav>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>{title}</h3>
      <p style={{ fontSize: '48px', fontWeight: 'bold', color, margin: 0 }}>{value}</p>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <BookingManagement />
          </ProtectedRoute>
        } />
        <Route path="/payments" element={
          <ProtectedRoute>
            <PaymentManagement />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
