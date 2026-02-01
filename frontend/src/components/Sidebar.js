import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  width: 250px;
  background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
  color: white;
  position: fixed;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
`;

const Logo = styled.div`
  padding: 30px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  
  h2 {
    font-size: 1.5rem;
    margin: 0;
    background: linear-gradient(90deg, #63b3ed, #4299e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p {
    font-size: 0.75rem;
    color: #a0aec0;
    margin: 5px 0 0 0;
  }
`;

const Nav = styled.nav`
  flex: 1;
  padding: 20px 0;
`;

const NavItem = styled.div`
  padding: 15px 25px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(255,255,255,0.05);
  }
  
  &.active {
    background: rgba(66, 153, 225, 0.15);
    border-left-color: #63b3ed;
    color: #63b3ed;
  }
  
  .icon {
    font-size: 1.2rem;
  }
`;

const StatusBar = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 0.8rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.status === 'connected' ? '#48bb78' : '#f56565'};
  }
`;

const ModelCount = styled.div`
  color: #a0aec0;
  font-size: 0.75rem;
`;

const Sidebar = ({ activeTab, setActiveTab, apiStatus, modelCount }) => {
  const menuItems = [
    { id: 'upload', label: 'Data Upload', icon: '📊' },
    { id: 'model', label: 'Model Fitting', icon: '🤖' },
    { id: 'roi', label: 'ROI Analysis', icon: '💰' },
    { id: 'optimize', label: 'Budget Optimizer', icon: '🎯' },
    { id: 'validate', label: 'Validation', icon: '✅' },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <h2>MMM Dashboard</h2>
        <p>Bayesian Media Mix Model</p>
      </Logo>
      
      <Nav>
        {menuItems.map(item => (
          <NavItem
            key={item.id}
            className={activeTab === item.id ? 'active' : ''}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavItem>
        ))}
      </Nav>
      
      <StatusBar>
        <StatusIndicator status={apiStatus}>
          <span className="dot"></span>
          <span>API: {apiStatus}</span>
        </StatusIndicator>
        <ModelCount>
          {modelCount} model{modelCount !== 1 ? 's' : ''} fitted
        </ModelCount>
      </StatusBar>
    </SidebarContainer>
  );
};

export default Sidebar;
