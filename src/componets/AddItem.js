import { useState } from "react";
import "../styles/SendItem.css";
import TagSelection from "./TagSelection";
import addItem from "../modules/send";
import CollectionSelection from "./CollectionSelection";

const AddItem = ({
  onExit,
  reFetch,
  tags,
  collections,
  SetLoader,
  lightMode,
}) => {
  const [name, setName] = useState(""),
    [link, setLink] = useState(""),
    [tag, setTag] = useState([]),
    [collection, setCollection] = useState("Unsorted");

  function newItem() {
    SetLoader(true);
    addItem(name, link, tag, collection, reFetch, onExit, SetLoader, "POST");
  }

  function SetName(e) {
    setName(e.target.value);
  }

  function SetLink(e) {
    setLink(e.target.value);
  }

  function SetTags(value) {
    setTag(value.map((e) => e.value.toLowerCase()));
  }

  function SetCollection(value) {
    setCollection(value.value);
  }

  function abort(e) {
    if (e.target.className === "add-overlay") {
      onExit();
    }
  }

  return (
    <>
      <div className="add-overlay" onClick={abort}></div>
      <div className="send-box">
        <div className="box">
          <h2>New bookmark</h2>
          <div className="AddItem-content">
            <h3>
              <span style={{ color: "red" }}>* </span>Link:
            </h3>
            <input
              onChange={SetLink}
              className="AddItem-input"
              type="search"
              placeholder="e.g. https://example.com/"
            />
            <h3>
              Name: <span className="optional">(Optional)</span>
            </h3>
            <input
              onChange={SetName}
              className="AddItem-input"
              type="search"
              placeholder="e.g. Example Tutorial"
            />
            <h3>
              Tags: <span className="optional">(Optional)</span>
            </h3>
            <TagSelection setTags={SetTags} tags={tags} lightMode={lightMode} />
            <h3>
              Collections: <span className="optional">(Optional)</span>
            </h3>
            <CollectionSelection
              setCollection={SetCollection}
              collections={collections}
              lightMode={lightMode}
            />
            <button onClick={newItem} className="send-btn">
              Add &#xf067;
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddItem;
