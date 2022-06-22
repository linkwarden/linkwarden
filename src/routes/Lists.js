import { useParams } from "react-router-dom";
import List from "../componets/List";

const Lists = ({ data, tags, lists, SetLoader, lightMode, reFetch }) => {
  const { listId } = useParams();
  const dataWithMatchingTag = data.filter((e) => {
    return e.list.includes(listId);
  });

  return (
    <div className="content">
      <List
        lightMode={lightMode}
        data={dataWithMatchingTag}
        tags={tags}
        lists={lists}
        SetLoader={SetLoader}
        reFetch={reFetch}
      />
    </div>
  );
};

export default Lists;
