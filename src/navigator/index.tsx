import React, {Children, FC} from 'react';
import Controls from './Controls';
import PGNExplorer from './PGNExplorer';

const Navigator: FC = ({ children }) => {
  return (
    <div className="card col-6" style={{ maxHeight: '500px', minWidth: '230px' }} >
      <ul className="list-group list-group-flush h-100">
        <li className="list-group-item d-flex">
          <Controls />
        </li>
        <li className="list-group-item flex-grow-1" style={{ overflowY: 'auto'}}>
          <PGNExplorer />
        </li>
        {Children.map(children, (child, i) => (
          <li className="list-group-item d-flex" key={i}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navigator;
