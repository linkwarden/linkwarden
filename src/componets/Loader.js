import '../styles/Loader.css';
import { InfinitySpin } from  'react-loader-spinner'


const Loader = () => {
  return (
    <div className='loader'>
      <InfinitySpin color="white" />
    </div>
  )
}

export default Loader