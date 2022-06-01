import '../styles/Sort.css'

const Sort = ({ onExit }) => {
    function abort(e) {
        if (e.target.className === "sort-overlay") {
            onExit();
        }
    }

  return (
    <>
        <div className='sort-overlay' onClick={abort}></div>
        <fieldset className='sort'>
            <legend>Sort by</legend>
            <label><input name="sort" type="radio" />Date (Newest first)</label>
            <label><input name="sort" type="radio" />Date (Oldest first)</label>
            <label><input name="sort" type="radio" />Name (A-Z)</label>
            <label><input name="sort" type="radio" />Name (Z-A)</label>
            <label><input name="sort" type="radio" />Title (A-Z)</label>
            <label><input name="sort" type="radio" />Title (Z-A)</label>
        </fieldset>
    </>
  )
}

export default Sort