import Dashboard from './pages/Dashboard.jsx';
import Pagamenti from './pages/Pagamenti.jsx';
import Settings from './pages/Settings.jsx';
import ScadenzeFiscali from './pages/ScadenzeFiscali.jsx';
import Profile from './pages/Profile.jsx';
import __Layout from './Layout';


export const PAGES = {
    "Dashboard": Dashboard,
    "Pagamenti": Pagamenti,
    "Settings": Settings,
    "ScadenzeFiscali": ScadenzeFiscali,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};