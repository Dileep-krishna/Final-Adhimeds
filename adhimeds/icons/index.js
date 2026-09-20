export const ChevronDownIcon = ({ className, style }) => (
  <i className={`bi bi-chevron-down ${className || ''}`} style={style}></i>
);
export const HorizontaLDots = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2" fill="currentColor"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    <circle cx="12" cy="18" r="2" fill="currentColor"/>
  </svg>
);
// Stubs for other icons used in menu (they render nothing or Bootstrap icons)
export const GridIcon = () => <i className="bi bi-grid"></i>;
export const CalenderIcon = () => <i className="bi bi-calendar"></i>;
export const UserCircleIcon = () => <i className="bi bi-person-circle"></i>;
export const ListIcon = () => <i className="bi bi-list-ul"></i>;
export const TableIcon = () => <i className="bi bi-table"></i>;
export const PageIcon = () => <i className="bi bi-file-text"></i>;
export const PieChartIcon = () => <i className="bi bi-pie-chart"></i>;
export const BoxCubeIcon = () => <i className="bi bi-box"></i>;
export const PlugInIcon = () => <i className="bi bi-plug"></i>;