import '../styles/Sort.css'

const Sort = ({ sortBy, onExit }) => {
    function abort(e) {
        if (e.target.className === "sort-overlay") {
            onExit();
        }
    }

    function sort(e) {
        sortBy(e.target.value);
    }

  return (
    <>
        <div className='sort-overlay' onClick={abort}></div>
        <div className='sort-box'>
            <fieldset className='sort' onClick={sort}>
                <legend>Sort by</legend>
                <button className='sort-by-btn' value='Default'>&#xf271; Date (Newest first)</button>
                <button className='sort-by-btn' value='Date (Oldest first)'>&#xf272; Date (Oldest first)</button>
                <button className='sort-by-btn' value='Name (A-Z)'>&#xf15d; Name (A-Z)</button>
                <button className='sort-by-btn' value='Name (Z-A)'>&#xf15e; Name (Z-A)</button>
                <button className='sort-by-btn' value='Title (A-Z)'>&#xf15d; Website title (A-Z)</button>
                <button className='sort-by-btn' value='Title (Z-A)'>&#xf15e; Website title (Z-A)</button>
            </fieldset>
        </div>
    </>
  )
}

export default Sort