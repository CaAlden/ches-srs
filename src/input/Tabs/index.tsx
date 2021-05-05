import React, { FC, ReactElement, useState } from 'react';

interface ITabContainerProps {
  tabs: Array<[string, ReactElement]>;
}

const TabsContainer: FC<ITabContainerProps> = ({ tabs }) => {
  const [selectedLabel, setSelectedLabel] = useState(tabs[0][0]);

  const [, selectedElm] = tabs.find(([label]) => label === selectedLabel) ?? ['undefined', 'TODO'];
  return (
    <div className="d-flex flex-grow-1" style={{ maxWidth: '600px' }}>
      <div className="w-100">
        <div className="col-12 p-1">
          <ul className="nav nav-tabs">
            {tabs.map(([label]) => (
              <li key={label} className="nav-item">
                <a
                  className={`nav-link${selectedLabel === label ? ' active' : ''}`}
                  href="#"
                  onClick={() => setSelectedLabel(label)}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-12 p-0">
          {selectedElm}
        </div>
      </div>
    </div>
  );
};

export default TabsContainer;
