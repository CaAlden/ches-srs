import React from 'react';
import Page from './Page';
import Board from '../board/Board';
import Navigator from '../navigator';

import TabsContainer from '../input/Tabs';
import FENInput from '../input/FENInput';
import PGNInput from '../input/PGNInput';
import {useRouteMatch} from 'react-router';

const InputPage = () => {
  const route = useRouteMatch<{ id: string }>({ path: '/opening/:id'});
  const isNew = Boolean(route?.params.id === 'new');
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
          <div className="flex-grow-1">
            <div className="mb-3 d-flex flex-column">
              <label className="form-label" htmlFor="opening-name">Opening</label>
              <input id="opening-name" className="form-text" size={18} />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="opening-color">Color</label>
              <div className="form-check" id="opening-color">
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1" checked />
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  White
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault2" />
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Black
                </label>
              </div>
            </div>
          </div>
          <div className="btn-group justify-content-center flex-grow-1">
            {isNew ? (
              <button className="btn btn-primary">Save</button>
            ) : (
              <>
                <button className="btn btn-sm btn-primary">Save</button>
                <button className="btn btn-sm btn-outline-primary">Revert</button>
                <button className="btn btn-sm btn-outline-danger">Delete</button>
              </>
            )}
          </div>
        </Navigator>
      </div>
    </Page>
  );
};

export default InputPage;
