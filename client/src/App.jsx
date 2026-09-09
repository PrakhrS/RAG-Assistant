import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    const checkHealth = async() =>{
      try {
        const response = await fetch('http://localhost:3000/api/check');
        const status = await response.json();
        setData(status.message);
      } catch (error) {
        console.error('No Connection', error);
        setData('Failed to connect to server. Check server');
      }
    };
    checkHealth();
  }, []);



  return (
    <div style={{ textAlign: 'center', marginTop: '3rem', fontFamily: 'sans-serif' }}>
        <p>Connection Status: <strong>{data}</strong></p>
    </div>
  )
}

export default App
