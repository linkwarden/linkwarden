import { useEffect, useState } from 'react';
import './styles/App.css';
import List from './componets/List';
import AddItem from './componets/AddItem';
import config from './config';
import Filters from './componets/Filters';
import Sort from './componets/Sort';
import sortList from './modules/sortList';
import filter from './modules/filterData';
import concatTags from './modules/concatTags';

function App() {
  const [data, setData] = useState([]),
    [newBox, setNewBox] = useState(false),
    [filterBox, setFilterBox] = useState(false),
    [sortBox, setSortBox] = useState(false),
    [searchQuery, setSearchQuery] = useState(''),
    [numberOfResults, setNumberOfResults] = useState(0),
    [nameChecked, setNameChecked] = useState(true),
    [descriptionChecked, setDescriptionChecked] = useState(true),
    [tagsChecked, setTagsChecked] = useState(true),
    [sortBy, setSortBy] = useState('Default');

  function handleNameCheckbox() {
    setNameChecked(!nameChecked);
  }

  function handleDescriptionCheckbox() {
    setDescriptionChecked(!descriptionChecked);
  }

  function handleTagsCheckbox() {
    setTagsChecked(!tagsChecked);
  }

  function exitAdding() {
    setNewBox(!newBox);
  }

  function exitFilter() {
    setFilterBox(!filterBox);
  }

  function exitSorting() {
    setSortBox(!sortBox);
  }

  function search(e) {
    setSearchQuery(e.target.value);
  }

  function sortByFunc(e) {
    setSortBy(e)
  }
  
  const filteredData = filter(data, searchQuery, nameChecked, tagsChecked, descriptionChecked);

  async function fetchData() {
    const ADDRESS = config.API.ADDRESS + ":" + config.API.PORT;
    const res = await fetch(ADDRESS + '/api');
    const resJSON = await res.json();
    const data = resJSON.reverse();
    const sortedData = sortList(data, sortBy);
    setData(sortedData);
  }

  useEffect(() => {
    fetchData();
  }, [sortBy]);

  useEffect(() => {
    setNumberOfResults(filteredData.length);
  }, [filteredData]);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="&#xf002; Search" onChange={search}/>
        <button className="btn" onClick={() => setNewBox(true)}>&#xf067;</button>
      </div>

      <p className="results">{numberOfResults > 0 ? numberOfResults + ' Bookmarks found' : 'No bookmarks found.'}</p>

      <button className='btn' onClick={() => setFilterBox(true)}>&#xf0b0;</button>
      <button className='btn' onClick={() => setSortBox(true)}>&#xf0dc;</button>
      <List data={filteredData} reFetch={fetchData} />

      {sortBox ? <Sort 
        sortBy={sortByFunc}
        onExit={exitSorting}
      /> : null}

      {filterBox ? <Filters 
        nameChecked={nameChecked}
        handleNameCheckbox={handleNameCheckbox}
        descriptionChecked={descriptionChecked}
        handleDescriptionCheckbox={handleDescriptionCheckbox}
        tagsChecked={tagsChecked} 
        handleTagsCheckbox={handleTagsCheckbox}
        onExit={exitFilter}
       /> : null}

      {newBox ? <AddItem 
        onExit={exitAdding} 
        reFetch={fetchData} 
        tags={() => concatTags(data)} 
      /> : null}
    </div>
  );
}

export default App;
