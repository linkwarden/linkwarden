import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddModal from './componets/AddModal';

function App() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  function exitAdding() {
    setIsAdding(!isAdding)
  }

  function search(e) {
    setSearchQuery(e.target.value);
  }

  const filteredData = data.filter((e) => {
    return (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  });

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/get');
      const resJSON = await res.json();
      const Data = resJSON.sort((a, b) => { return b-a });
      setData(Data);
    }

    fetchData();
  }, [data]);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="Search for Name/Title/Tag" onChange={search}/>
        <button className="add-btn"><span className="material-icons-outlined md-36" onClick={() => setIsAdding(true)}>add</span></button>
        <button className="settings-btn"><span className="material-icons-outlined md-36">settings</span></button>
      </div>
      <List data={filteredData} />
      {isAdding ? <AddModal onExit={exitAdding} /> : null}
    </div>
  );
}

export default App;
