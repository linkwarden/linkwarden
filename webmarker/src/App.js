import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddModal from './componets/AddModal';

function App() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  function exitAdding() {
    setIsAdding(!isAdding)
  }

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/get');
      const resJSON = await res.json();
      const Data = resJSON.sort((a, b) => { return b-a });
      setData(Data);
    }

    fetchData();
  }, []);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="Search bookmarks"/>
        <button className="search-btn"><span className="material-icons-outlined md-36">search</span></button>
        <button className="add-btn"><span className="material-icons-outlined md-36" onClick={() => setIsAdding(true)}>add</span></button>
        <button className="settings-btn"><span className="material-icons-outlined md-36">settings</span></button>
      </div>
      <List data={data} />
      {isAdding ? <AddModal onExit={exitAdding} /> : null}
    </div>
  );
}

export default App;
