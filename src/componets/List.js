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
            </tr>
        </thead>
        <tbody>
        {data.map((e, i) => {
            return <tr key={i}>
                <td>{i + 1}</td>
                <td>{e.login}</td>
                <td>{e.node_id}</td>
                <td>{e.html_url}</td>
            </tr>
        })}
        </tbody>
    </table>
  )
}

export default List