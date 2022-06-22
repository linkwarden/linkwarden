import { useEffect, useState } from "react";
import "./styles/App.css";
import List from "./componets/List";
import AddItem from "./componets/AddItem";
import { API_HOST } from "./config";
import Filters from "./componets/Filters";
import sortList from "./modules/sortList";
import filter from "./modules/filterData";
import concatTags from "./modules/concatTags";
import concatLists from "./modules/concatLists";
import NoResults from "./componets/NoResults";
import Loader from "./componets/Loader";
import SideBar from "./componets/SideBar";
import Tags from "./routes/Tags.js";
import Lists from "./routes/Lists.js";
import { Route, Routes } from "react-router-dom";

function App() {
  const [data, setData] = useState([]),
    [newBox, setNewBox] = useState(false),
    [filterBox, setFilterBox] = useState(false),
    [searchQuery, setSearchQuery] = useState(""),
    [numberOfResults, setNumberOfResults] = useState(0),
    [filterCheckbox, setFilterCheckbox] = useState([true, true, true]),
    [sortBy, setSortBy] = useState(1),
    [loader, setLoader] = useState(false),
    [lightMode, setLightMode] = useState(
      localStorage.getItem("light-mode") === "true"
    ),
    [toggle, setToggle] = useState(false);

  function SetLoader(x) {
    setLoader(x);
  }

  function handleFilterCheckbox(newVal) {
    setFilterCheckbox(newVal);
  }

  function exitAdding() {
    setNewBox(false);
  }

  function exitFilter() {
    setFilterBox(false);
  }

  function search(e) {
    setSearchQuery(e.target.value);
  }

  function handleSorting(e) {
    setSortBy(e);
  }

  function handleToggleSidebar() {
    setToggle(!toggle);
  }

  const filteredData = filter(data, searchQuery, filterCheckbox);

  async function fetchData() {
    const res = await fetch(API_HOST + "/api");
    const resJSON = await res.json();
    const data = resJSON.reverse();
    setData(data);
  }

  useEffect(() => {
    const sortedData = sortList(data, sortBy);
    setData(sortedData);
    exitFilter();
    // eslint-disable-next-line
  }, [sortBy, filterCheckbox]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setNumberOfResults(filteredData.length);
  }, [filteredData]);

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }

    localStorage.setItem("light-mode", lightMode);
  }, [lightMode]);

  return (
    <div className="App">
      <SideBar
        tags={concatTags(data)}
        lists={concatLists(data)}
        handleToggleSidebar={handleToggleSidebar}
        toggle={toggle}
      />

      <div className="content">
        <div className="head">
          <button
            className="sidebar-btn btn"
            style={{ marginRight: "10px" }}
            onClick={handleToggleSidebar}
          >
            &#xf0c9;
          </button>
          <input
            className="search"
            type="search"
            placeholder="&#xf002; Search"
            onChange={search}
          />

          <button
            className="btn"
            style={{ marginLeft: "10px" }}
            onClick={() => setFilterBox(true)}
          >
            &#xf160;
          </button>
          <button className="add-btn btn" onClick={() => setNewBox(true)}>
            &#xf067;
          </button>
          <button
            className="dark-light-btn btn"
            onClick={() => setLightMode(!lightMode)}
          ></button>
        </div>

        {numberOfResults > 0 ? (
          <p className="results">{numberOfResults} Bookmarks found</p>
        ) : null}

        {filterBox ? (
          <Filters
            filterCheckbox={filterCheckbox}
            handleFilterCheckbox={handleFilterCheckbox}
            sortBy={handleSorting}
            sort={sortBy}
            onExit={exitFilter}
          />
        ) : null}

        {newBox ? (
          <AddItem
            SetLoader={SetLoader}
            onExit={exitAdding}
            reFetch={fetchData}
            lightMode={lightMode}
            tags={() => concatTags(data)}
            lists={() => concatLists(data)}
          />
        ) : null}

        {numberOfResults === 0 ? <NoResults /> : null}

        {loader ? <Loader lightMode={lightMode} /> : null}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <div className="content">
              <List
                lightMode={lightMode}
                SetLoader={SetLoader}
                data={filteredData}
                tags={concatTags(data)}
                lists={concatLists(data)}
                reFetch={fetchData}
              />
            </div>
          }
        />

        <Route
          path="tags/:tagId"
          element={
            <Tags
              lightMode={lightMode}
              SetLoader={SetLoader}
              data={filteredData}
              tags={concatTags(data)}
              lists={concatLists(data)}
              reFetch={fetchData}
            />
          }
        />

        <Route
          path="lists/:listId"
          element={
            <Lists
              lightMode={lightMode}
              SetLoader={SetLoader}
              data={filteredData}
              tags={concatTags(data)}
              lists={concatLists(data)}
              reFetch={fetchData}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
