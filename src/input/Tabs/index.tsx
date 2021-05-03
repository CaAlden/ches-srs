import React, { FC, ReactElement, useState } from 'react';
import Button from '../../ui/Button';

interface ITabButton {
  label: string;
  setSelected: () => void;
}

const TabButton: FC<ITabButton> = ({ label, setSelected }) => {
  return <Button onClick={setSelected}>{label}</Button>;
};

interface ITabContainerProps {
  tabs: Array<[string, ReactElement]>;
}

const TabsContainer: FC<ITabContainerProps> = ({ tabs }) => {
  const [selectedLabel, setSelectedLabel] = useState(tabs[0][0]);

  const [, selectedElm] = tabs.find(([label]) => label === selectedLabel) ?? ['undefined', 'TODO'];
  return (
    <div>
      <div>
        {tabs.map(([label]) => (
          <TabButton key={label} label={label} setSelected={() => setSelectedLabel(label)} />
        ))}
      </div>
      <div>{selectedElm}</div>
    </div>
  );
};

export default TabsContainer;
