import React from 'react';
import Page from './Page';
import Board from './board/Board';
import Navigator from './navigator';

import TabsContainer from './input/Tabs';
import FENInput from './input/FENInput';
import PGNInput from './input/PGNInput';

const InputPage = () => {
  return (
    <Page title="New Opening Input">
      <div className="col-8 g-3">
        <div className="d-flex justify-content-end p-3 col-12">
          <Board />
        </div>
        <div className="col-12 p-3 d-flex justify-content-end">
          <TabsContainer tabs={[
              ['FEN Input', <FENInput />],
              ['PGN Input', <PGNInput />],
            ]}
          />
        </div>
      </div>
      <div className="p-3 col-4 d-flex">
        <Navigator>
          <div className="btn-group">
            <button className="btn btn-primary">Ok</button>
            <button className="btn btn-danger">Wrong</button>
          </div>
        </Navigator>
      </div>
    </Page>
  );
};

export default InputPage;
