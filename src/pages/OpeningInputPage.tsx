import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { OrderedMap as ImmutableMap } from 'immutable';
import { v4 } from 'uuid';
import Page from './Page';
import Board from '../board/Board';
import Navigator from '../navigator';

import TabsContainer from '../input/Tabs';
import FENInput from '../input/FENInput';
import PGNInput from '../input/PGNInput';
import { useRouteMatch } from 'react-router';
import { useOpening, useOpeningsControl } from '../persist/hooks';
import { IOpening } from '../types';
import {useController} from '../controller';

const getNewOpening = (id: string): IOpening => ({
  id,
  name: '',
  moveTree: ImmutableMap(),
  color: 'w',
  items: [],
});

const InputPage = () => {
  const controller = useController();
  const openingControl = useOpeningsControl();

  const [dirty, setDirty] = useState(0);
  const route = useRouteMatch<{ id: string }>({ path: '/opening/:id' });
  const routeId = route?.params.id;
  const id = useRef(routeId && routeId !== 'new' ? routeId : v4());
  const { value: storedOpening } = useOpening(id.current);
  const [opening, setOpening] = useState(storedOpening ?? getNewOpening(id.current));
  const history = useHistory();
  const [isNew, setIsNew] = useState(Boolean(routeId === 'new' || storedOpening === null))
  
  useEffect(() => {
    setIsNew(Boolean(routeId === 'new' || storedOpening === null));
  }, [dirty]);

  useEffect(() => {
    controller.setMoveTree(opening.moveTree);
  }, []);

  useEffect(() => {
    if (opening.moveTree !== controller.moveTree) {
      setOpening({
        ...opening,
        moveTree: controller.moveTree,
      });
    }
  }, [controller.moveTree]);

  return (
    <Page title="New Opening Input">
      <div className="col-8 g-3">
        <div className="d-flex justify-content-end p-3 col-12">
          <Board />
        </div>
        <div className="col-12 p-3 d-flex justify-content-end">
          <TabsContainer
            tabs={[
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
              <label className="form-label" htmlFor="opening-name">
                Opening
              </label>
              <input
                id="opening-name"
                className="form-text"
                size={18}
                value={opening.name}
                onChange={e => setOpening({ ...opening, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="opening-color">
                Color
              </label>
              <div className="form-check" id="opening-color">
                <input
                  className="form-check-input"
                  type="radio"
                  name="flexRadioDefault"
                  id="flexRadioDefault1"
                  checked={opening.color === 'w'}
                  onChange={e => {
                    if (e.target.checked) {
                      setOpening({ ...opening, color: 'w' });
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="flexRadioDefault1">
                  White
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="flexRadioDefault"
                  id="flexRadioDefault2"
                  checked={opening.color === 'b'}
                  onChange={e => {
                    if (e.target.checked) {
                      setOpening({ ...opening, color: 'b' });
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="flexRadioDefault2">
                  Black
                </label>
              </div>
            </div>
          </div>
          <div className="btn-group justify-content-center flex-grow-1">
            {isNew ? (
              <button
                className="btn btn-primary"
                onClick={() => {
                  openingControl.updateOpening(opening);
                  setDirty(d => d + 1);
                  history.push(`/opening/${id.current}`);
                }}>
                Save
              </button>
            ) : (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    openingControl.updateOpening(opening);
                    setDirty(d => d + 1);
                  }}>
                  Save
                </button>
                <button
                  onClick={() => {
                    if (storedOpening) {
                      setOpening(storedOpening);
                    }
                  }}
                  className="btn btn-sm btn-outline-primary">
                  Revert
                </button>
                <button
                  onClick={() => {
                    openingControl.removeOpening(opening);
                    history.push('/?deleted=1');
                  }}
                  className="btn btn-sm btn-outline-danger">
                  Delete
                </button>
              </>
            )}
          </div>
        </Navigator>
      </div>
    </Page>
  );
};

export default InputPage;
