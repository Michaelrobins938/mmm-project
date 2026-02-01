import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const BudgetInput = styled.div`
  margin-bottom: 30px;
  
  label {
    display: block;
    color: #4a5568;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #4299e1;
    }
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #ed8936, #dd6b20);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(237, 137, 54, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 30px;
`;

const ResultCard = styled.div`
  background: #f7fafc;
  padding: 20px;
  border-radius: 12px;
  
  h4 {
    color: #2d3748;
    margin-bottom: 15px;
  }
`;

const AllocationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #edf2f7;
    font-weight: 600;
    color: #4a5568;
  }
  
  .change-positive {
    color: #48bb78;
  }
  
  .change-negative {
    color: #f56565;
  }
`;

const COLORS = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565'];

const BudgetOptimizer = ({ models, selectedModel }) => {
  const [totalBudget, setTotalBudget] = useState(100000);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runOptimization = async () => {
    if (!selectedModel) {
      toast.error('Please select a model first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/optimize', {
        model_id: selectedModel,
        total_budget: parseFloat(totalBudget),
        min_budgets: {},
        max_budgets: {}
      });
      
      setOptimizationResult(response.data);
      toast.success('Budget optimized successfully!');
    } catch (error) {
      toast.error('Optimization failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!optimizationResult) return [];
    
    return Object.entries(optimizationResult.optimal_allocation).map(([channel, budget]) => ({
      channel,
      budget,
      percentage: (budget / optimizationResult.total_budget * 100).toFixed(1)
    }));
  };

  const prepareRoiData = () => {
    if (!optimizationResult) return [];
    
    return Object.entries(optimizationResult.roi_by_channel).map(([channel, roi]) => ({
      channel,
      roi: roi * 100
    }));
  };

  return (
    <Container>
      <h2>Budget Optimizer</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Optimize media budget allocation to maximize total return
      </p>

      <BudgetInput>
        <label>Total Budget ($)</label>
        <input 
          type="number" 
          value={totalBudget}
          onChange={(e) => setTotalBudget(e.target.value)}
          min="0"
          step="1000"
        />
      </BudgetInput>

      <Button onClick={runOptimization} disabled={loading || !selectedModel}>
        {loading ? 'Optimizing...' : '🎯 Optimize Budget'}
      </Button>

      {optimizationResult && (
        <ResultsGrid>
          <ResultCard>
            <h4>Optimal Allocation</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prepareChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ channel, percentage }) => `${channel}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="budget"
                >
                  {prepareChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </ResultCard>

          <ResultCard>
            <h4>ROI by Channel</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareRoiData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="roi" fill="#48bb78" />
              </BarChart>
            </ResponsiveContainer>
          </ResultCard>

          <ResultCard>
            <h4>Summary</h4>
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Total Budget:</strong> ${optimizationResult.total_budget.toLocaleString()}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Expected Contribution:</strong> ${optimizationResult.expected_contribution.toLocaleString()}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Net Profit:</strong> 
                <span style={{ color: optimizationResult.net_profit > 0 ? '#48bb78' : '#f56565' }}>
                  ${optimizationResult.net_profit.toLocaleString()}
                </span>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Overall ROI:</strong> 
                <span style={{ color: (optimizationResult.net_profit / optimizationResult.total_budget) > 0 ? '#48bb78' : '#f56565' }}>
                  {((optimizationResult.net_profit / optimizationResult.total_budget) * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <strong>Optimization Status:</strong> 
                <span style={{ color: optimizationResult.optimization_success ? '#48bb78' : '#f56565' }}>
                  {optimizationResult.optimization_success ? '✅ Success' : '❌ Failed'}
                </span>
              </div>
            </div>
          </ResultCard>

          <ResultCard style={{ gridColumn: '1 / -1' }}>
            <h4>Detailed Budget Allocation</h4>
            <AllocationTable>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Optimal Budget</th>
                  <th>% of Total</th>
                  <th>Expected ROI</th>
                  <th>Marginal Return</th>
                </tr>
              </thead>
              <tbody>
                {prepareChartData().map((item, idx) => {
                  const roi = optimizationResult.roi_by_channel[item.channel];
                  const marginal = optimizationResult.marginal_returns[item.channel];
                  return (
                    <tr key={item.channel}>
                      <td><strong>{item.channel}</strong></td>
                      <td>${item.budget.toLocaleString()}</td>
                      <td>{item.percentage}%</td>
                      <td style={{ color: roi > 0 ? '#48bb78' : '#f56565' }}>
                        {(roi * 100).toFixed(1)}%
                      </td>
                      <td>{marginal?.toFixed(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </AllocationTable>
          </ResultCard>
        </ResultsGrid>
      )}
    </Container>
  );
};

export default BudgetOptimizer;
