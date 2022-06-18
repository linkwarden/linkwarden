import "../styles/ViewArchived.css";
import { API_HOST } from "../config";

const ViewArchived = ({ id }) => {
  const screenshotPath =
    API_HOST + "/screenshots/" + id + ".png";
  const pdfPath =
    API_HOST + "/pdfs/" + id + ".pdf";

  return (
    <div className="view-archived">
      <a
        className="link"
        href={screenshotPath}
        target="_blank"
        rel="noreferrer"
      >
        Screenshot
      </a>
      <hr className="seperator" />
      <a className="link" href={pdfPath} target="_blank" rel="noreferrer">
        PDF
      </a>
    </div>
  );
};

export default ViewArchived;
