import { useEffect, useState } from 'react';
import './App.css';
import List from './componets/List';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/get');
      const resJSON = await res.json();
      console.log(resJSON)
      setData(resJSON);
    }

    fetchData();
  }, []);
  
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="Search bookmarks"/>
        <button className="search-btn"><span className="material-icons-outlined md-36">search</span></button>
        <button className="add-btn"><span className="material-icons-outlined md-36">add</span></button>
        <button className="settings-btn"><span className="material-icons-outlined md-36">settings</span></button>
      </div>
      <List data={data} />
    </div>
  );
}

export default App;

// fetch("/post", {
     
//   // Adding method type
//   method: "POST",
   
//   // Adding body or contents to send
//   body: JSON.stringify({
//       name: "foo",
//       title: "bar",
//       link: liveinternet.ru,
//       tag: Red
//   }),
   
//   // Adding headers to the request
//   headers: {
//       "Content-type": "application/json; charset=UTF-8"
//   }
// });