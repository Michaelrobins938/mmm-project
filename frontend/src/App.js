import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import DataUpload from './components/DataUpload';
import ModelFitting from './components/ModelFitting';
import ROIDashboard from './components/ROIDashboard';
import BudgetOptimizer from './components/BudgetOptimizer';
import ValidationReport from './components/ValidationReport';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 30px;
  margin-left: 250px;
  overflow-y: auto;
`;

const Header = styled.header`
  margin-bottom: 30px;
  
  h1 {
    font-size: 2rem;
    color: #1a202c;
    margin-bottom: 10px;
  }
  
  p {
    color: #718096;
    font-size: 1rem;
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [datasets, setDatasets] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkApiStatus();
    fetchDatasets();
    fetchModels();
  }, []);

  const checkApiStatus = async () => {
    try {
      await axios.get('/health');
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
    }
  };

  const fetchDatasets = async () => {
    // Would fetch from API
    setDatasets([]);
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get('/models');
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DataUpload onDatasetUpload={fetchDatasets} />;
      case 'model':
        return (
          <ModelFitting 
            datasets={datasets} 
            onModelFit={fetchModels}
            setSelectedModel={setSelectedModel}
          />
        );
      case 'roi':
        return (
          <ROIDashboard 
            models={models} 
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        );
      case 'optimize':
        return (
          <BudgetOptimizer 
            models={models}
            selectedModel={selectedModel}
          />
        );
      case 'validate':
        return (
          <ValidationReport 
            models={models}
            selectedModel={selectedModel}
          />
        );
      default:
        return <DataUpload />;
    }
  };

  return (
    <Container>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        apiStatus={apiStatus}
        modelCount={models.length}
      />
      <MainContent>
        <Header>
          <h1>Bayesian Media Mix Model</h1>
          <p>Production-ready MMM with adstock, saturation, and budget optimization</p>
        </Header>
        {renderContent()}
      </MainContent>
      <ToastContainer position="top-right" />
    </Container>
  );
}

export default App;
