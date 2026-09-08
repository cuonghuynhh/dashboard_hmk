import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';

export const useLocalFilter = () => {
  const { globalRegion, globalBranch } = useAppContext();
  const [localRegion, setLocalRegion] = useState(globalRegion);
  const [localBranch, setLocalBranch] = useState(globalBranch);

  useEffect(() => {
    setLocalRegion(globalRegion);
    setLocalBranch(globalBranch);
  }, [globalRegion, globalBranch]);

  return { localRegion, setLocalRegion, localBranch, setLocalBranch };
};
