import { useState, useEffect, useRef } from 'react';

const useStore = () => {
  const [dirty, setDirty] = useState(0);

  useEffect(() => {
    const listener = addEventListener('storage', (e) => {

    });
    return () => {
    };
  });
};
