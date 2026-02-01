import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const DropzoneContainer = styled.div`
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 30px;
  
  &:hover {
    border-color: #4299e1;
    background: #ebf8ff;
  }
  
  &.active {
    border-color: #4299e1;
    background: #ebf8ff;
  }
  
  h3 {
    color: #2d3748;
    margin-bottom: 10px;
  }
  
  p {
    color: #718096;
    font-size: 0.9rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: linear-gradient(135deg, #4299e1, #3182ce);
    color: white;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(66, 153, 225, 0.4);
    }
  }
  
  &.secondary {
    background: #edf2f7;
    color: #4a5568;
    
    &:hover {
      background: #e2e8f0;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Preview = styled.div`
  margin-top: 30px;
  
  h4 {
    color: #2d3748;
    margin-bottom: 15px;
  }
`;

const DataTable = styled.div`
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    
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

const DataUpload = ({ onDatasetUpload }) => {
  const [uploadedData, setUploadedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/data/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadedData(response.data);
      toast.success('Dataset uploaded successfully!');
      onDatasetUpload();
      
      // Fetch preview
      const previewResponse = await axios.get(`/data/${response.data.dataset_id}`);
      setUploadedData(prev => ({ ...prev, preview: previewResponse.data }));
    } catch (error) {
      toast.error('Failed to upload dataset');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [onDatasetUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const generateSyntheticData = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/data/generate', {
        n_weeks: 104,
        channels: ['TV', 'Radio', 'Digital', 'Social'],
        base_revenue: 100000
      });
      
      setGeneratedData(response.data);
      toast.success('Synthetic data generated!');
      onDatasetUpload();
    } catch (error) {
      toast.error('Failed to generate data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Data Management</h2>
      <p style={{ color: '#718096', marginBottom: '30px' }}>
        Upload your media mix data or generate synthetic data for testing
      </p>

      <DropzoneContainer {...getRootProps()} className={isDragActive ? 'active' : ''}>
        <input {...getInputProps()} />
        <h3>📁 Drop CSV file here</h3>
        <p>or click to select file</p>
        <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
          Required columns: date, revenue, and at least one channel spend column
        </p>
      </DropzoneContainer>

      <ButtonGroup>
        <Button 
          className="secondary" 
          onClick={generateSyntheticData}
          disabled={loading}
        >
          {loading ? 'Generating...' : '🎲 Generate Synthetic Data'}
        </Button>
      </ButtonGroup>

      {uploadedData && uploadedData.preview && (
        <Preview>
          <h4>Dataset Preview: {uploadedData.filename}</h4>
          <DataTable>
            <table>
              <thead>
                <tr>
                  {uploadedData.preview.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedData.preview.preview.slice(0, 5).map((row, idx) => (
                  <tr key={idx}>
                    {uploadedData.preview.columns.map(col => (
                      <td key={col}>
                        {typeof row[col] === 'number' 
                          ? row[col].toFixed(2) 
                          : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
          <p style={{ marginTop: '10px', color: '#718096' }}>
            Total rows: {uploadedData.preview.total_rows} | 
            Dataset ID: {uploadedData.dataset_id}
          </p>
        </Preview>
      )}

      {generatedData && (
        <Preview>
          <h4>Generated Synthetic Dataset</h4>
          <p>Dataset ID: {generatedData.dataset_id}</p>
          <p>Channels: {generatedData.channels.join(', ')}</p>
          <p>Rows: {generatedData.rows}</p>
          
          <h5 style={{ marginTop: '20px' }}>True ROI (Ground Truth):</h5>
          <ul>
            {Object.entries(generatedData.true_roi).map(([channel, roi]) => (
              <li key={channel}>
                {channel}: {(roi * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </Preview>
      )}
    </Container>
  );
};

export default DataUpload;
