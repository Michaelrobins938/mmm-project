import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const ConfigSection = styled.div`
  margin-bottom: 30px;
`;

const Label = styled.label`
  display: block;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 20px;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 30px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #4a5568;
  
  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const Button = styled.button`
  padding: 15px 30px;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 20px;
  
  .fill {
    height: 100%;
    background: linear-gradient(90deg, #4299e1, #48bb78);
    transition: width 0.3s;
    width: ${props => props.progress};
  }
`;

const Results = styled.div`
  margin-top: 30px;
  padding: 20px;
  background: #f7fafc;
  border-radius: 8px;
  
  h4 {
    color: #2d3748;
    margin-bottom: 15px;
  }
`;

const ChannelParams = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const ChannelCard = styled.div`
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  
  h5 {
    color: #2d3748;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 2px solid #e2e8f0;
  }
  
  .param {
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
    font-size: 0.9rem;
    
    .label {
      color: #718096;
    }
    
    .value {
      color: #2d3748;
      font-weight: 600;
      font-family: monospace;
    }
  }
`;

const ModelFitting = ({ datasets, onModelFit, setSelectedModel }) => {
  const [selectedDataset, setSelectedDataset] = useState('');
  const [targetColumn, setTargetColumn] = useState('revenue');
  const [channelColumns, setChannelColumns] = useState(['TV_spend', 'Radio_spend', 'Digital_spend', 'Social_spend']);
  const [config, setConfig] = useState({
    use_adstock: true,
    use_saturation: true,
    use_trend: true,
    use_seasonality: true
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const handleFitModel = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setLoading(true);
    setProgress(10);
    
    try {
      const response = await axios.post('/model/fit', {
        dataset_id: selectedDataset,
        channel_columns: channelColumns,
        target_column: targetColumn,
        use_adstock: config.use_adstock,
        use_saturation: config.use_saturation,
        use_trend: config.use_trend,
        use_seasonality: config.use_seasonality
      });
      
      setProgress(100);
      setResults(response.data);
      setSelectedModel(response.data.model_id);
      onModelFit();
      toast.success('Model fitted successfully!');
    } catch (error) {
      toast.error('Failed to fit model');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Model Fitting</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Configure and fit the Bayesian Media Mix Model
      </p>

      <ConfigSection>
        <Label>Dataset</Label>
        <Select 
          value={selectedDataset} 
          onChange={(e) => setSelectedDataset(e.target.value)}
        >
          <option value="">Select a dataset...</option>
          <option value="demo">demo_data.csv</option>
        </Select>

        <Label>Target Column (Revenue)</Label>
        <Select 
          value={targetColumn} 
          onChange={(e) => setTargetColumn(e.target.value)}
        >
          <option value="revenue">revenue</option>
          <option value="conversions">conversions</option>
          <option value="sales">sales</option>
        </Select>
      </ConfigSection>

      <ConfigSection>
        <Label>Model Components</Label>
        <CheckboxGroup>
          <CheckboxLabel>
            <input 
              type="checkbox" 
              checked={config.use_adstock}
              onChange={(e) => setConfig({...config, use_adstock: e.target.checked})}
            />
            Adstock (Carryover Effects)
          </CheckboxLabel>
          <CheckboxLabel>
            <input 
              type="checkbox" 
              checked={config.use_saturation}
              onChange={(e) => setConfig({...config, use_saturation: e.target.checked})}
            />
            Saturation (Diminishing Returns)
          </CheckboxLabel>
          <CheckboxLabel>
            <input 
              type="checkbox" 
              checked={config.use_trend}
              onChange={(e) => setConfig({...config, use_trend: e.target.checked})}
            />
            Trend Component
          </CheckboxLabel>
          <CheckboxLabel>
            <input 
              type="checkbox" 
              checked={config.use_seasonality}
              onChange={(e) => setConfig({...config, use_seasonality: e.target.checked})}
            />
            Seasonality
          </CheckboxLabel>
        </CheckboxGroup>
      </ConfigSection>

      <Button onClick={handleFitModel} disabled={loading}>
        {loading ? 'Fitting Model... (5-10 minutes)' : '🚀 Fit Bayesian MMM'}
      </Button>

      {loading && (
        <ProgressBar progress={`${progress}%`}>
          <div className="fill"></div>
        </ProgressBar>
      )}

      {results && (
        <Results>
          <h4>Fitted Model Parameters</h4>
          <p>Model ID: <strong>{results.model_id}</strong></p>
          <p>Intercept: {results.fitted_params.intercept?.toFixed(4)}</p>
          
          <ChannelParams>
            {Object.entries(results.fitted_params.channels).map(([channel, params]) => (
              <ChannelCard key={channel}>
                <h5>{channel}</h5>
                {params.beta && (
                  <div className="param">
                    <span className="label">Effectiveness (β):</span>
                    <span className="value">{params.beta.toFixed(4)}</span>
                  </div>
                )}
                {params.decay && (
                  <div className="param">
                    <span className="label">Adstock Decay:</span>
                    <span className="value">{params.decay.toFixed(4)}</span>
                  </div>
                )}
                {params.alpha_sat && (
                  <div className="param">
                    <span className="label">Saturation α:</span>
                    <span className="value">{params.alpha_sat.toFixed(0)}</span>
                  </div>
                )}
                {params.K_sat && (
                  <div className="param">
                    <span className="label">Saturation K:</span>
                    <span className="value">{params.K_sat.toFixed(0)}</span>
                  </div>
                )}
              </ChannelCard>
            ))}
          </ChannelParams>
        </Results>
      )}
    </Container>
  );
};

export default ModelFitting;
