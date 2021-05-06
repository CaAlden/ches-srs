import React, {FC, useEffect} from 'react';
import {Link, useRouteMatch} from 'react-router-dom';

interface IProps {
  title: string;
}

const Page: FC<IProps> = ({ title, children }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
  const active = useRouteMatch();
  return (
    <div className="container-fluid p-0">
      <nav className="navbar navbar-light" style={{ background: '#e3f2fd' }}>
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">ChesSRS</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/" className={`nav-link${active.path === '/' ? ' active' : ''}`}>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/opening/new" className={`nav-link${active.path.startsWith('/opening') ? ' active' : ''}`}>
                  Opening Editor
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/about" className={`nav-link${active.path === '/about' ? ' active' : ''}`}>
                  About
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="d-flex g-3 justify-content-center p-3">
        {children}
      </div>
    </div>
  );
};

export default Page;
