import React from 'react';
import {Link} from 'react-router-dom';
import Page from './Page';

interface IOpening {
  id: string;
  name: string;
  color: 'b' | 'w';
  items: unknown[];
  pendingReviews: number;
}

const openings: IOpening[] = [
  {
    id: '1',
    name: "Queen's Gambit",
    color: 'w',
    items: [],
    pendingReviews: 6,
  },
  {
    id: '2',
    name: 'Ruy Lopez',
    color: 'w',
    items: [],
    pendingReviews: 18,
  },
  {
    id: '3',
    name: 'Italian Game',
    color: 'w',
    items: [],
    pendingReviews: 0,
  },
  {
    id: '4',
    name: "King's Indian Defense",
    color: 'b',
    items: [],
    pendingReviews: 11,
  },
  {
    id: '5',
    name: 'Nimzo-Indian Defense',
    color: 'b',
    items: [],
    pendingReviews: 20,
  },
  {
    id: '6',
    name: "Caro-Kann Defense",
    color: 'b',
    items: [],
    pendingReviews: 0,
  },
];

const DashboardPage = () => {
  return (
    <Page title="Dashboard">
      <div className="col-8 p-3">
        <div className="col-12 d-flex justify-content-between">
          <p>Hello, you have {openings.reduce((acc, op) => acc + op.pendingReviews, 0)} pending review(s)</p>
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
              <tr key={op.id}>
                <td>{op.name}</td>
                <td>
                  {op.color === 'w' ? (
                    <span className="badge bg-light text-dark">White</span>
                  ) : (
                    <span className="badge bg-dark">Black</span>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm">View</button>
                    <button className={`d-flex gap-1 btn btn-sm btn-primary${op.pendingReviews > 0 ? '' : ' disabled'}`}>
                      Study
                      {op.pendingReviews > 0 && (
                        <span className="badge bg-danger d-flex align-items-center">{op.pendingReviews}</span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  );
};

export default DashboardPage;
