import { GlobeWrapper } from './components/GlobeWrapper';
import { MatchesSection } from './components/MatchesSection';

function App() {
  return (
    <main style={{
      width: '100%',
      background: '#ffffff',
      fontFamily: 'sans-serif',
    }}>
      {/* <div style={{ height: '100vh' }}> */}
      <MatchesSection />
        <GlobeWrapper />
      {/* </div> */}
    </main>
  );
}

export default App;
