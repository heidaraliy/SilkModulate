import AudioUploader from './components/AudioUploader/AudioUploader';
import background from './assets/background.png';

function App() {
  return (
    <div
      className="bg-cover bg-center bg-no-repeat h-screen-max p-4 sm:p-8 lg:p-12"
      style={{ backgroundImage: `url(${background})` }}
    >
      <AudioUploader />
    </div>
  );
}

export default App;
