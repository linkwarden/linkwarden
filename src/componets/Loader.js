import '../styles/Loader.css';
import { InfinitySpin } from  'react-loader-spinner'


const Loader = ({ lightMode }) => {
  return (
    <div className='loader'>
      <InfinitySpin color={lightMode ? "Black" : "White"} />
    </div>
  )
}

export default Loader