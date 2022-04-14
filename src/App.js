import './App.css';

function App() {
  return (
    <div className="App">
      <div className="head">
        <input className="search" type="search" placeholder="Search bookmarks"/>
        <button className="search-btn"><span class="material-icons-outlined md-36">search</span></button>
        <button className="add-btn"><span class="material-icons-outlined md-36">add</span></button>
        <button className="settings-btn"><span class="material-icons-outlined md-36">settings</span></button>
      </div>
      <div className="lables">
        <p id="id">#</p>
        <p className="lable">Name</p>
        <p className="lable">Title</p>
        <p className="lable">Link</p>
      </div>
    </div>
  );
}

export default App;
