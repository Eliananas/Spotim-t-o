import React from 'react';
import { navigate, usePath } from 'hookrouter';
import banner from '../img/banner.png';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import SpotifyLoginStatusButton from './SpotifyLoginStatusButton';

interface IProps {
  user: SpotifyApi.CurrentUsersProfileResponse | undefined,
  onAuthButtonLoggedInClick: () => void
}

const navbarLinks: {[key: string]: string} = {
  '/' : 'Home',
  '/sort' : 'Sort',
  '/about' : 'About',
};

const Navigation: React.FunctionComponent<IProps> = (props: IProps) => {
  const { user } = props;
  const { onAuthButtonLoggedInClick } = props;

  const currentPath = usePath();

  const goTo = (location: string) => () => navigate(location);

  return <Navbar collapseOnSelect expand="sm" bg="light" variant="light" sticky="top">
    <Container>
      <Navbar.Brand onClick={goTo('/')}>
        <img
          src={banner}
          height="30"
          className="d-inline-block align-top"
          alt="Emotionify Banner Logo"
          style={{ cursor: 'pointer' }}
        />
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-nav" />
      <Navbar.Collapse id="responsive-navbar-nav">
        <Nav className="mr-auto">
          {Object.keys(navbarLinks).map(path => 
            <Nav.Link key={path} href="#" onClick={goTo(path)} active={currentPath === path}>{navbarLinks[path]}</Nav.Link>
          )}
        </Nav>
        <Nav>
          <SpotifyLoginStatusButton user={user} onLoggedInClick={onAuthButtonLoggedInClick} />
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>;
}

export default Navigation;
