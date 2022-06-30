import "../styles/Filters.css";
import { useState } from "react";
import { AwesomeButton } from "react-awesome-button";
import "react-awesome-button/dist/themes/theme-blue.css";

const Filters = ({
  filterCheckbox,
  handleFilterCheckbox,
  sortBy,
  sort,
  onExit,
}) => {
  const [nameChecked, setNameChecked] = useState(filterCheckbox[0]),
    [titleChecked, setTitleChecked] = useState(filterCheckbox[1]),
    [tagChecked, setTagChecked] = useState(filterCheckbox[2]),
    [radio, setRadio] = useState(sort);

  function abort(e) {
    if (e.target.className === "filter-overlay") {
      onExit();
    }
  }

  function handleRadio(e) {
    setRadio(e.target.value);
  }

  function applyChanges() {
    handleFilterCheckbox([nameChecked, titleChecked, tagChecked]);
    sortBy(radio);
  }

  return (
    <>
      <div className="filter-overlay" onClick={abort}></div>
      <div className="filter-box">
        <div className="filter">
          <h2>Filter Results</h2>

          <div className="filter-groups">
            <div className="section">
              <h3>Sort By</h3>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "1"}
                  onChange={handleRadio}
                  type="radio"
                  value={1}
                />
                &#xf271; Date (Newest first)
              </label>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "2"}
                  onChange={handleRadio}
                  type="radio"
                  value={2}
                />
                &#xf272; Date (Oldest first)
              </label>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "3"}
                  onChange={handleRadio}
                  type="radio"
                  value={3}
                />
                &#xf15d; Name (A-Z)
              </label>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "4"}
                  onChange={handleRadio}
                  type="radio"
                  value={4}
                />
                &#xf15e; Name (Z-A)
              </label>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "5"}
                  onChange={handleRadio}
                  type="radio"
                  value={5}
                />
                &#xf15d; Website title (A-Z)
              </label>
              <label>
                <input
                  name="sort"
                  checked={radio.toString() === "6"}
                  onChange={handleRadio}
                  type="radio"
                  value={6}
                />
                &#xf15e; Website title (Z-A)
              </label>
            </div>

            <div className="section">
              <h3>Include/Exclude</h3>
              <label>
                <input
                  type="checkbox"
                  checked={nameChecked}
                  onChange={() => setNameChecked(!nameChecked)}
                />
                Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={titleChecked}
                  onChange={() => setTitleChecked(!titleChecked)}
                />
                Website title
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={tagChecked}
                  onChange={() => setTagChecked(!tagChecked)}
                />
                Tags
              </label>
            </div>
          </div>

          <AwesomeButton
            size="medium"
            action={applyChanges}
            style={{
              marginTop: "20px",
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
              marginBottom: "15px"
            }}
          >
            Apply &#xf00c;
          </AwesomeButton>
        </div>
      </div>
    </>
  );
};

export default Filters;
