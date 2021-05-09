import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useItems, useOpeningsControl } from '../persist/hooks';
import { IItem, IOpening } from '../types';
import { useIsMounted, useQuery } from '../utils';
import Page from './Page';

function getPendingReviews(items: IItem[]): IItem[] {
  const now = new Date(Date.now());
  return items.filter(i => i.nextReview !== null && i.nextReview < now);
}

function getUnlearnedItems(items: IItem[]) {
  return items.filter(i => i.nextReview === null);
}

const usePendingReviews = () => {
  const { openings } = useOpeningsControl();
  const allItems = useItems(openings.flatMap(op => op.items).toArray());
  return getPendingReviews(allItems).length;
};

const OpeningRow: FC<{ opening: IOpening }> = ({ opening }) => {
  const items = useItems(opening.items);
  const pendingReviews = useMemo(() => getPendingReviews(items).length, [items]);
  const unlearedItems = useMemo(() => getUnlearnedItems(items).length, [items]);
  return (
    <tr>
      <td>{opening.name}</td>
      <td>
        {opening.color === 'w' ? (
          <span className="badge bg-light text-dark">White</span>
        ) : (
          <span className="badge bg-dark">Black</span>
        )}
      </td>
      <td>
        <span className="text-success">{pendingReviews}</span>
      </td>
      <td>
        <span className="text-primary">{unlearedItems}</span>
      </td>
      <td>
        <div className="d-flex gap-2">
          <Link to={`/opening/${opening.id}`} className="btn btn-outline-primary btn-sm" role="button">
            Edit
          </Link>
          <Link
            to={`/study/${opening.id}`}
            className={`d-flex gap-1 btn btn-sm btn-primary${pendingReviews + unlearedItems > 0 ? '' : ' disabled'}`}
            role="button">
            Study
            {pendingReviews > 0 && <span className="badge bg-danger d-flex align-items-center">{pendingReviews}</span>}
          </Link>
        </div>
      </td>
    </tr>
  );
};

const DashboardPage = () => {
  const { openings } = useOpeningsControl();
  const pendingReviews = usePendingReviews();
  const query = useQuery();
  const history = useHistory();
  const [showDeleted, setShowDeleted] = useState(query.has('deleted'));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useIsMounted();
  useEffect(() => {
    if (showDeleted && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setShowDeleted(false);
          history.push('/');
        }
      }, 3000);
    }

    return () => {
      if (isMounted.current && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showDeleted]);

  return (
    <Page title="Dashboard">
      <div className="col-8 p-3">
        {showDeleted && (
          <div className="alert alert-danger">
            <span>Opening Deleted</span>
          </div>
        )}
        <div className="col-12 d-flex justify-content-between">
          <p>Hello, you have {pendingReviews} pending review(s)</p>
          <Link to="/opening/new" className="btn btn-outline-success" role="button">
            Add New Opening
          </Link>
        </div>
        <table className="table table-hover align-middle m-0">
          <thead>
            <tr>
              <th>Opening</th>
              <th>Color</th>
              <th>Review Ready</th>
              <th>Unlearned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {openings.map(op => (
              <OpeningRow key={op.id} opening={op} />
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
};

export default DashboardPage;
