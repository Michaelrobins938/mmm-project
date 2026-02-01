import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Button = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #9f7aea, #805ad5);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(159, 122, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBanner = styled.div`
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 600;
  font-size: 1.2rem;
  
  &.passed {
    background: #c6f6d5;
    color: #22543d;
  }
  
  &.failed {
    background: #fed7d7;
    color: #742a2a;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetricCard = styled.div`
  background: ${props => props.passed ? '#f0fff4' : '#fff5f5'};
  border: 2px solid ${props => props.passed ? '#9ae6b4' : '#feb2b2'};
  padding: 20px;
  border-radius: 12px;
  
  h4 {
    color: #2d3748;
    margin-bottom: 10px;
    font-size: 0.9rem;
  }
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: ${props => props.passed ? '#48bb78' : '#f56565'};
  }
  
  .threshold {
    font-size: 0.8rem;
    color: #718096;
    margin-top: 5px;
  }
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  h3 {
    color: #2d3748;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
  }
`;

const ComparisonTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin-top: 15px;
  
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
  
  .match {
    color: #48bb78;
    font-weight: 600;
  }
  
  .mismatch {
    color: #f56565;
    font-weight: 600;
  }
`;

const ValidationReport = ({ models, selectedModel }) => {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/model/${selectedModel}/validate`, {
        dataset_id: 'demo'
      });
      
      setValidationResults(response.data.validation_results);
      toast.success('Validation complete!');
    } catch (error) {
      toast.error('Validation failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllPassed = () => {
    if (!validationResults) return false;
    
    const pred = validationResults.prediction_accuracy;
    const conv = validationResults.convergence;
    
    return (
      conv?.converged &&
      pred?.pass_threshold?.mape &&
      pred?.pass_threshold?.r_squared &&
      pred?.pass_threshold?.ci_coverage
    );
  };

  return (
    <Container>
      <h2>Model Validation</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Validate model performance against ground truth and check convergence diagnostics
      </p>

      <Button onClick={runValidation} disabled={loading || !selectedModel}>
        {loading ? 'Running Validation...' : '✅ Run Validation'}
      </Button>

      {validationResults && (
        <>
          <StatusBanner className={checkAllPassed() ? 'passed' : 'failed'}>
            {checkAllPassed() ? '✅ ALL VALIDATION TESTS PASSED' : '❌ SOME VALIDATION TESTS FAILED'}
          </StatusBanner>

          <Section>
            <h3>Convergence Diagnostics</h3>
            <MetricsGrid>
              <MetricCard passed={validationResults.convergence?.r_hat_max < 1.1}>
                <h4>R-hat (Max)</h4>
                <div className="value">
                  {validationResults.convergence?.r_hat_max?.toFixed(3)}
                </div>
                <div className="threshold">Threshold: &lt; 1.1</div>
              </MetricCard>
              
              <MetricCard passed={validationResults.convergence?.divergences < 10}>
                <h4>Divergences</h4>
                <div className="value">
                  {validationResults.convergence?.divergences}
                </div>
                <div className="threshold">Threshold: &lt; 10</div>
              </MetricCard>
              
              <MetricCard passed={validationResults.convergence?.ess_min > 100}>
                <h4>ESS (Min)</h4>
                <div className="value">
                  {validationResults.convergence?.ess_min?.toFixed(0)}
                </div>
                <div className="threshold">Threshold: &gt; 100</div>
              </MetricCard>
            </MetricsGrid>
          </Section>

          <Section>
            <h3>Prediction Accuracy</h3>
            <MetricsGrid>
              <MetricCard passed={validationResults.prediction_accuracy?.mape < 10}>
                <h4>MAPE</h4>
                <div className="value">
                  {validationResults.prediction_accuracy?.mape?.toFixed(2)}%
                </div>
                <div className="threshold">Target: &lt; 10%</div>
              </MetricCard>
              
              <MetricCard passed={validationResults.prediction_accuracy?.r_squared > 0.8}>
                <h4>R²</h4>
                <div className="value">
                  {validationResults.prediction_accuracy?.r_squared?.toFixed(3)}
                </div>
                <div className="threshold">Target: &gt; 0.8</div>
              </MetricCard>
              
              <MetricCard passed={validationResults.prediction_accuracy?.ci_coverage > 90}>
                <h4>CI Coverage</h4>
                <div className="value">
                  {validationResults.prediction_accuracy?.ci_coverage?.toFixed(1)}%
                </div>
                <div className="threshold">Target: &gt; 90%</div>
              </MetricCard>
            </MetricsGrid>
          </Section>

          {validationResults.parameter_recovery && (
            <Section>
              <h3>Parameter Recovery (vs Ground Truth)</h3>
              <p style={{ color: '#718096', marginBottom: '15px' }}>
                Overall Accuracy: {(validationResults.parameter_recovery.overall_accuracy * 100).toFixed(1)}%
              </p>
              
              <ComparisonTable>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Parameter</th>
                    <th>True Value</th>
                    <th>Fitted Value</th>
                    <th>Relative Error</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(validationResults.parameter_recovery?.decay_recovery || {}).map(([channel, data]) => (
                    <tr key={`${channel}-decay`}>
                      <td>{channel}</td>
                      <td>Decay</td>
                      <td>{data.true.toFixed(4)}</td>
                      <td>{data.fitted.toFixed(4)}</td>
                      <td>{(data.relative_error * 100).toFixed(1)}%</td>
                      <td className={data.recovery_score > 0.8 ? 'match' : 'mismatch'}>
                        {data.recovery_score > 0.8 ? '✓ Good' : '✗ Poor'}
                      </td>
                    </tr>
                  ))}
                  {Object.entries(validationResults.parameter_recovery?.beta_recovery || {}).map(([channel, data]) => (
                    <tr key={`${channel}-beta`}>
                      <td>{channel}</td>
                      <td>Beta (Effectiveness)</td>
                      <td>{data.true.toFixed(4)}</td>
                      <td>{data.fitted.toFixed(4)}</td>
                      <td>{(data.relative_error * 100).toFixed(1)}%</td>
                      <td className={data.recovery_score > 0.8 ? 'match' : 'mismatch'}>
                        {data.recovery_score > 0.8 ? '✓ Good' : '✗ Poor'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ComparisonTable>
            </Section>
          )}

          {validationResults.roi_accuracy && (
            <Section>
              <h3>ROI Estimation Accuracy</h3>
              <p style={{ color: '#718096', marginBottom: '15px' }}>
                Overall Accuracy: {(validationResults.roi_accuracy.overall_accuracy * 100).toFixed(1)}%
              </p>
              
              <ComparisonTable>
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>True ROI</th>
                    <th>Estimated ROI</th>
                    <th>Absolute Error</th>
                    <th>In 95% CI</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(validationResults.roi_accuracy?.channel_roi || {}).map(([channel, data]) => (
                    <tr key={channel}>
                      <td>{channel}</td>
                      <td>{(data.true_roi * 100).toFixed(1)}%</td>
                      <td>{(data.estimated_roi * 100).toFixed(1)}%</td>
                      <td>{(data.absolute_error * 100).toFixed(1)}%</td>
                      <td className={data.within_95_ci ? 'match' : 'mismatch'}>
                        {data.within_95_ci ? '✓ Yes' : '✗ No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ComparisonTable>
            </Section>
          )}
        </>
      )}
    </Container>
  );
};

export default ValidationReport;
