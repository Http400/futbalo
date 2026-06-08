import { useState } from 'react';
import { GlobeWrapper } from './components/GlobeWrapper';
import { MatchesSection } from './components/MatchesSection';

function App() {
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);

  return (
    <main style={{
      width: '100%',
      background: '#ffffff',
      fontFamily: 'sans-serif',
    }}>
      {/* <div style={{ height: '100vh' }}> */}
      <MatchesSection onStadiumFocus={setHoveredCoords} />
        <GlobeWrapper externalFocusPoint={hoveredCoords} />
      {/* </div> */}
    </main>
  );
}

export default App;
