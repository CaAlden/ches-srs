import React from 'react';
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
    name: "Queen's Gambit",
    color: 'w',
    items: [],
    pendingReviews: 6,
  },
];

const DashboardPage = () => {
  return (
    <Page title="Dashboard">
      <div className="col-8 p-3">
        <p>Hello, you have {openings.reduce((acc, op) => acc + op.pendingReviews, 0)} pending review(s)</p>
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
                    <button className="btn btn-outline-primary">View Lines</button>
                    <button className={`d-flex gap-1 btn btn-primary${op.pendingReviews > 0 ? '' : ' disabled'}`}>
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
