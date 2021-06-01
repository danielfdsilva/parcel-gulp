import React, { useCallback, useState } from 'react';
import { render } from 'react-dom';

import { baseUrl } from './config';

// Load some data from the file created by the task.
// This file is gitignored and generated every time.
import { time } from './time.json';

// Import an image as a data url.
import favicon from 'url:../graphics/meta/favicon.png';

function Root() {
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await fetch(`${baseUrl}/api/readings.json`);
      const result = await response.json();
      setLoaded(result);
    } catch (error) {
      setLoaded('Error');
    }
  }, []);

  return (
    <div>
      <h1>Hello</h1>
      <p>
        Time from file: <strong>{new Date(time).toISOString()}</strong>
      </p>

      <p>
        {!loaded && 'Data not loaded.'}
        {!loaded && (
          <button type='button' onClick={loadData}>
            Load data
          </button>
        )}
      </p>

      {loaded
        ? loaded.entries?.map((e) => (
            <p key={e.city}>
              <strong>{e.city}</strong> {e.temp}º
            </p>
          )) || loaded
        : null}

      <h3>Image loaded via data-url</h3>
      <img src={favicon} width={96} />

      <h3>Image loaded directly</h3>
      <img src={`${baseUrl}/default-meta-image.png`} width={200} />
    </div>
  );
}

render(<Root />, document.getElementById('app-container'));
