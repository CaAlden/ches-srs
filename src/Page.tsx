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
          <a className="navbar-brand" href="/">ChesSRS</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/">
                  <a className={`nav-link${active.path === '/' ? ' active' : ''}`} href="/">Home</a>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/input">
                  <a className={`nav-link${active.path === '/input' ? ' active' : ''}`} href="/input">Opening Editor</a>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/about">
                  <a className={`nav-link${active.path === '/about' ? ' active' : ''}`} href="/about">About</a>
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
