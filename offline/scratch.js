// To operation folder
// To get data by object
import React, { useState } from 'react';

function App() {
  const [objectId, setObjectId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const getData = async () => {
    try {
      const response = await fetch(`/data/${objectId}`);
      const responseData = await response.json();

      if (response.ok) {
        setData(responseData);
        setError(null);
      } else {
        setError(responseData.error);
        setData(null);
      }
    } catch (error) {
      console.error('An error occurred:', error);
      setError('An error occurred. Please try again.');
      setData(null);
    }
  };

  return (
    <div className="container">
      <h2>Data Viewer</h2>
      <label htmlFor="objectIdInput">Enter ObjectID:</label>
      <input
        type="text"
        id="objectIdInput"
        value={objectId}
        onChange={(e) => setObjectId(e.target.value)}
      />
      <button onClick={getData}>Get Data</button>
      {error && <div className="error">{error}</div>}
      {data && (
        <div className="data">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;


// 