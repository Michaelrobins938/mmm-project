import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ErrorBar } from 'recharts';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const ModelSelector = styled.div`
  margin-bottom: 30px;
  
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChartContainer = styled.div`
  height: 400px;
  margin: 30px 0;
`;

const ROICards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
`;

const ROICard = styled.div`
  background: linear-gradient(135deg, #f7fafc, #edf2f7);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid ${props => props.roi > 0 ? '#48bb78' : '#f56565'};
  
  h4 {
    color: #4a5568;
    margin-bottom: 10px;
    font-size: 0.9rem;
  }
  
  .roi-value {
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.roi > 0 ? '#48bb78' : '#f56565'};
  }
  
  .confidence {
    font-size: 0.8rem;
    color: #718096;
    margin-top: 5px;
  }
`;

const DataTable = styled.div`
  margin-top: 30px;
  overflow-x: auto;
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    
    th {
      background: #f7fafc;
      font-weight: 600;
      color: #4a5568;
    }
    
    tr:hover {
      background: #f7fafc;
    }
  }
`;

const ROIDashboard = ({ models, selectedModel, setSelectedModel }) => {
  const [roiData, setRoiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculateROI = async () => {
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/model/${selectedModel}/roi`, {
        dataset_id: 'demo'  // Would be dynamic in production
      });
      
      setRoiData(response.data.roi_by_channel);
      toast.success('ROI calculated successfully!');
    } catch (error) {
      toast.error('Failed to calculate ROI');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!roiData) return [];
    
    return Object.entries(roiData).map(([channel, data]) => ({
      channel,
      roi: data.roi_mean * 100,
      lower: data.roi_lower * 100,
      upper: data.roi_upper * 100,
      spend: data.total_spend,
      contribution: data.total_contribution
    }));
  };

  const chartData = prepareChartData();

  return (
    <Container>
      <h2>ROI Analysis</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Calculate and visualize return on investment for each media channel
      </p>

      <ModelSelector>
        <label>Select Model</label>
        <select 
          value={selectedModel || ''} 
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          <option value="">Choose a fitted model...</option>
          {models.map(model => (
            <option key={model.model_id} value={model.model_id}>
              {model.model_id} ({model.channels?.join(', ')})
            </option>
          ))}
        </select>
      </ModelSelector>

      <Button onClick={calculateROI} disabled={loading || !selectedModel}>
        {loading ? 'Calculating...' : '💰 Calculate ROI'}
      </Button>

      {roiData && (
        <>
          <ChartContainer>
            <h4 style={{ marginBottom: '20px' }}>ROI by Channel (%)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="roi" fill="#4299e1" name="ROI (%)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ROICards>
            {chartData.map(item => (
              <ROICard key={item.channel} roi={item.roi}>
                <h4>{item.channel}</h4>
                <div className="roi-value">
                  {item.roi > 0 ? '+' : ''}{item.roi.toFixed(1)}%
                </div>
                <div className="confidence">
                  95% CI: [{item.lower.toFixed(1)}%, {item.upper.toFixed(1)}%]
                </div>
              </ROICard>
            ))}
          </ROICards>

          <DataTable>
            <h4 style={{ marginBottom: '20px' }}>Detailed Breakdown</h4>
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>ROI</th>
                  <th>95% CI</th>
                  <th>Total Spend</th>
                  <th>Est. Contribution</th>
                  <th>Net Impact</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(item => (
                  <tr key={item.channel}>
                    <td><strong>{item.channel}</strong></td>
                    <td style={{ color: item.roi > 0 ? '#48bb78' : '#f56565', fontWeight: 600 }}>
                      {item.roi > 0 ? '+' : ''}{item.roi.toFixed(1)}%
                    </td>
                    <td>[{item.lower.toFixed(1)}%, {item.upper.toFixed(1)}%]</td>
                    <td>${item.spend?.toLocaleString()}</td>
                    <td>${item.contribution?.toLocaleString()}</td>
                    <td style={{ color: (item.contribution - item.spend) > 0 ? '#48bb78' : '#f56565' }}>
                      ${(item.contribution - item.spend)?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </>
      )}
    </Container>
  );
};

export default ROIDashboard;
