import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddModal from './componets/AddModal';
import config from './config.json';

function App() {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [numberOfResults, setNumberOfResults] = useState(0);

  function exitAdding() {
    setIsAdding(!isAdding);
  }

  function search(e) {
    setSearchQuery(e.target.value);
  }
  
  const filteredData = data.filter((e) => {
    return (e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  });

  async function fetchData() {
    const address = config.api.address + ":" + config.api.port;
    const res = await fetch(address + '/api');
    const resJSON = await res.json();
    const Data = resJSON.sort((a, b) => { return b-a });
    setData(Data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setNumberOfResults(filteredData.length);
  }, [filteredData]);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="&#xf002; Search for Name / Title / Tag" onChange={search}/>
        <button className="add-btn" onClick={() => setIsAdding(true)}>&#xf067;</button>
      </div>
      <p className="results">{numberOfResults > 0 ? numberOfResults + ' Bookmarks' : 'No bookmarks.'}</p>
      <List data={filteredData} reFetch={fetchData} />
      {isAdding ? <AddModal onExit={exitAdding} reFetch={fetchData} /> : null}
    </div>
  );
}

export default App;
