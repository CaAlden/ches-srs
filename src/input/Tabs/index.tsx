import React, { FC, ReactElement, useState } from 'react';
import Button from '../../ui/Button';

import './index.css';

interface ITabButton {
  label: string;
  setSelected: () => void;
  selected: boolean;
}

const TabButton: FC<ITabButton> = ({ label, setSelected, selected }) => {
  return (
    <Button
      onClick={setSelected}
      style={{
        background: selected ? '#aaa' : undefined,
        borderBottom: `3px solid ${selected ? 'black' : 'transparent'}`,
      }}>
      {label}
    </Button>
  );
};

interface ITabContainerProps {
  tabs: Array<[string, ReactElement]>;
}

const TabsContainer: FC<ITabContainerProps> = ({ tabs }) => {
  const [selectedLabel, setSelectedLabel] = useState(tabs[0][0]);

  const [, selectedElm] = tabs.find(([label]) => label === selectedLabel) ?? ['undefined', 'TODO'];
  return (
    <div className="tab-container">
      <div className="tab-button-container">
        {tabs.map(([label]) => (
          <TabButton
            selected={label === selectedLabel}
            key={label}
            label={label}
            setSelected={() => setSelectedLabel(label)}
          />
        ))}
      </div>
      <div className="tab">{selectedElm}</div>
    </div>
  );
};

export default TabsContainer;
