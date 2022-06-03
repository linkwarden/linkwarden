import '../styles/ViewArchived.css';
import config from '../config';

const ViewArchived = ({ id }) => {
    const screenshotPath = config.API.ADDRESS + ":" + config.API.PORT + '/screenshots/' + id + '.png';
    const pdfPath = config.API.ADDRESS + ":" + config.API.PORT + '/pdfs/' + id + '.pdf';

  return (
    <div className='view-archived'>
        <a href={screenshotPath} target='_blank' rel="noreferrer">Screenshot</a>
        <hr className='seperator' />
        <a href={pdfPath} target='_blank' rel="noreferrer">PDF</a>
    </div>
  )
}

export default ViewArchived;