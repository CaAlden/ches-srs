import React, { FC, useEffect, useRef, useState } from 'react';
import Page from './Page';
import Board from '../board/Board';
import Navigator from '../navigator';

import { Redirect, useRouteMatch } from 'react-router';
import { useItem, useItems, useOpening } from '../persist/hooks';
import { Controller, ProvideController } from '../controller';
import { Quality, updateItem } from '../srs';

const StudyButtons: FC<{
  onStudy: (quality: Quality) => void;
  correct: boolean;
  setCorrect: (correct: boolean) => void;
}> = ({ onStudy, correct, setCorrect }) => {
  return (
    <div>
      {correct ? (
        <>
          <div className="alert alert-success">
            <span className="fw-bold">Correct!</span>
          </div>
          <div className="btn-group">
            <button className="btn btn-success" onClick={() => onStudy(Quality.Perfect)}>
              Easy
            </button>
            <button className="btn btn-primary" onClick={() => onStudy(Quality.CorrectHesitation)}>
              Correct
            </button>
            <button className="btn btn-warning" onClick={() => onStudy(Quality.CorrectDifficult)}>
              Difficult
            </button>
            <button className="btn btn-outline-danger" onClick={() => setCorrect(false)}>
              Mark Incorrect
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="alert alert-danger">
            <span className="fw-bold">Incorrect</span>
          </div>
          <div className="btn-group">
            <button className="btn btn-primary" onClick={() => onStudy(Quality.IncorrectEasy)}>
              Know It
            </button>
            <button className="btn btn-outline-primary" onClick={() => onStudy(Quality.Incorrect)}>
              Wrong
            </button>
            <button className="btn btn-outline-primary" onClick={() => onStudy(Quality.Blackout)}>
              No Memory
            </button>
            <button className="btn btn-outline-success" onClick={() => setCorrect(true)}>
              Mark Correct
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const StudyItem: FC<{ id: string; perspective: 'w' | 'b' }> = ({ id, perspective }) => {
  const { value: item, setValue: setItem } = useItem(id);
  const [studying, setStudying] = useState(true);
  const [correct, setCorrect] = useState(false);
  const controller = useRef(new Controller({
    perspective: perspective === 'w' ? 'white' : 'black',
    canMove: chess => {
      return item !== null && item.pgn === chess.pgn();
    },
    afterMove: chess => {
      setStudying(false);
      setCorrect(chess.fen() === item?.finalPosition);
    },
  }));

  useEffect(() => {
    // If the id changes, set studying to true.
    setStudying(true);
    if (item) {
      controller.current.setPgn(item.pgn);
    }
  }, [id]);

  if (item === null) {
    return (
      <div className="alert alert-danger">
        <span>Uh oh! Item {id} is broken or missing</span>
      </div>
    );
  }

  const isNew = item.nextReview === null;
  const scrolledAway = controller.current.pgn !== item.pgn;
  return (
    <ProvideController value={controller.current}>
      <div className="col-12 g-3 d-flex justify-content-center">
        <Board />
        <Navigator>
          {studying ? (
            <>
              <div className="d-flex justify-content-center flex-grow-1">
                <span className="badge badge-primary">New</span>
                <div className="alert alert-info">
                  {scrolledAway
                    ? 'Scroll back to the last position and make a move to continue studying.'
                    : isNew
                    ? 'Try to guess the correct move.'
                    : 'Play the next move.'}
                </div>
              </div>
              {isNew && !scrolledAway && (
                <div className="justify-content-center flex-grow-1">
                  <button className="btn btn-success" onClick={() => {}}>
                    Show Next Move
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {item.comment !== '' && (
                <div className="d-flex justify-content-center flex-grow-1">
                  <p>{item.comment}</p>
                </div>
              )}
              <div className="d-flex justify-content-center flex-grow-1">
                <StudyButtons
                  correct={correct}
                  setCorrect={setCorrect}
                  onStudy={q => {
                    if (isNew) {
                      // Add the item back into the pool to be reviewed right now;
                      setItem({ ...item, nextReview: new Date(Date.now()) });
                    } else {
                      setItem(updateItem(item, q));
                    }
                  }}
                />
              </div>
            </>
          )}
        </Navigator>
      </div>
    </ProvideController>
  );
};

function sortItemsByReviewDateAsc(a: IItem, b: IItem): number {
  if (a.nextReview === null && b.nextReview === null) {
    return 0;
  }
  if (a.nextReview === null) {
    return 1;
  }
  if (b.nextReview === null) {
    return -1;
  }

  return a.nextReview.getUTCMilliseconds() - b.nextReview.getUTCMilliseconds();
}

const StudyPage = () => {
  const route = useRouteMatch<{ id: string }>({ path: '/study/:id' });
  if (route === null) {
    // TODO: Throw with error boundary?
    throw new Error('Expected id');
  }
  const { value: storedOpening } = useOpening(route.params.id);
  const items = useItems(storedOpening?.items ?? []);
  const sorted = items
    .sort(sortItemsByReviewDateAsc)
    .filter(item => item.nextReview === null || item.nextReview < new Date(Date.now()));

  if (storedOpening === null) {
    return <Redirect to="/404" />;
  }

  return (
    <Page title="Study">
      <div>
        <div>
          <h1>{storedOpening.name}</h1>
        </div>
        {sorted.length === 0 ? (
          <div className="alert alert-success">Nothing to study!</div>
        ) : (
          <StudyItem perspective={storedOpening.color} id={sorted[0].id} />
        )}
      </div>
    </Page>
  );
};

export default StudyPage;
