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
            <legend>Sort List</legend>
            <label><input name="sort" type="radio" />Date</label>
            <label><input name="sort" type="radio" />Name</label>
            <label><input name="sort" type="radio" />Title</label>
            <label><input name="sort" type="radio" />Tags</label>
        </fieldset>
    </>
  )
}

export default Sort