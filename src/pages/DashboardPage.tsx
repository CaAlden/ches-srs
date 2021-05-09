import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useItems, useOpeningControl } from '../persist/hooks';
import { IItem, IOpening } from '../types';
import { useIsMounted, useQuery } from '../utils';
import Page from './Page';

function getPendingReviews(items: IItem[]): number {
  return 55;
}
const usePendingReviews = () => getPendingReviews([]);

const OpeningRow: FC<{ opening: IOpening }> = ({ opening }) => {
  const items = useItems(opening.items);
  const pendingReviews = useMemo(() => getPendingReviews(items), [items]);
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
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm">View</button>
          <button className={`d-flex gap-1 btn btn-sm btn-primary${pendingReviews > 0 ? '' : ' disabled'}`}>
            Study
            {pendingReviews > 0 && <span className="badge bg-danger d-flex align-items-center">{pendingReviews}</span>}
          </button>
        </div>
      </td>
    </tr>
  );
};

const DashboardPage = () => {
  const { openings } = useOpeningControl();
  const pendingReviews = usePendingReviews();
  const query = useQuery();
  const history = useHistory();
  const [showDeleted, setShowDeleted] = useState(query.has('deleted'));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useIsMounted();
  useEffect(() => {
    if (showDeleted && !timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        setShowDeleted(false);
        history.push('/');
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
        {showDeleted && 
          <div className="alert alert-danger">
            <span>Opening Deleted</span>
          </div>
        }
        <div className="col-12 d-flex justify-content-between">
          <p>Hello, you have {pendingReviews} pending review(s)</p>
          <Link to="/opening/new" className="btn btn-outline-success">
            Add New Opening
          </Link>
        </div>
        <table className="table table-hover align-middle m-0">
          <thead>
            <tr>
              <th>Opening</th>
              <th>Color</th>
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
