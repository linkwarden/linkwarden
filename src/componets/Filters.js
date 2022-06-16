import "../styles/Filters.css";

const Filters = ({
  nameChecked,
  handleNameCheckbox,
  descriptionChecked,
  handleDescriptionCheckbox,
  tagsChecked,
  handleTagsCheckbox,
  onExit,
}) => {
  function abort(e) {
    if (e.target.className === "filter-overlay") {
      onExit();
    }
  }

  return (
    <>
      <div className="filter-overlay" onClick={abort}></div>
      <div className="filter-box">
        <fieldset className="filter">
          <legend>Filter by</legend>
          <label>
            <input
              type="checkbox"
              checked={nameChecked}
              onChange={handleNameCheckbox}
            />
            Name
          </label>
          <label>
            <input
              type="checkbox"
              checked={descriptionChecked}
              onChange={handleDescriptionCheckbox}
            />
            Website title
          </label>
          <label>
            <input
              type="checkbox"
              checked={tagsChecked}
              onChange={handleTagsCheckbox}
            />
            Tags
          </label>
        </fieldset>
      </div>
    </>
  );
};

export default Filters;
