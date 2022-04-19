const List = ({data}) => {
    console.log(data)

  return (
    <table className="table">
        <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                <th>Title</th>
                <th>Link</th>
                <th>Tag</th>
            </tr>
        </thead>
        <tbody>
        {data.map((e, i) => {
            return <tr key={i}>
                <td>{i + 1}</td>
                <td>{e.name}</td>
                <td>{e.title}</td>
                <td>{e.link}</td>
                <td>{e.tag}</td>
            </tr>
        })}
        </tbody>
    </table>
  )
}

export default List