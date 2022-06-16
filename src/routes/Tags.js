import { useParams } from "react-router-dom";
import List from "../componets/List";

const Tags = ({ data, tags, SetLoader, lightMode, reFetch }) => {
  const { tagId } = useParams();
  const dataWithMatchingTag = data.filter((e) => {
    return e.tag.includes(tagId);
  });

  return (
    <div className="content">
      <List
        lightMode={lightMode}
        data={dataWithMatchingTag}
        tags={tags}
        SetLoader={SetLoader}
        reFetch={reFetch}
      />
    </div>
  );
};

export default Tags;
